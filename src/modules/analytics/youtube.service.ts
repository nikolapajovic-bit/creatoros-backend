import { google } from "googleapis";
import { env } from "@/config/env";
import { SocialAccount } from "@/modules/analytics/socialAccount.model";
import { AppError } from "@/utils/AppError";

function createOAuthClient() {
  return new google.auth.OAuth2(
    env.GOOGLE_OAUTH_CLIENT_ID,
    env.GOOGLE_OAUTH_CLIENT_SECRET,
    env.GOOGLE_OAUTH_REDIRECT_URI,
  );
}

const SCOPES = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/yt-analytics.readonly",
];

/**
 * Generiše URL na koji šaljemo korisnika da odobri pristup svom YouTube nalogu.
 * `state` nosi ID našeg korisnika, tako da u callback-u znamo kome pripada token.
 */
export function getAuthUrl(userId: string): string {
  const client = createOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline", // traži refresh token, ne samo kratkotrajan access token
    prompt: "consent", // forsira Google da UVEK vrati refresh token (ne samo prvi put)
    scope: SCOPES,
    state: userId,
  });
}

/**
 * Razmenjuje autorizacioni kod (koji Google šalje u callback-u) za access/refresh tokene,
 * povlači osnovne podatke o kanalu, i čuva sve u bazu.
 */
export async function handleCallback(code: string, userId: string) {
  const client = createOAuthClient();
  const { tokens } = await client.getToken(code);

  if (!tokens.access_token || !tokens.expiry_date) {
    throw new AppError("Failed to obtain access token from Google", 502);
  }

  client.setCredentials(tokens);
  const youtube = google.youtube({ version: "v3", auth: client });

  const channelResponse = await youtube.channels.list({
    part: ["snippet", "statistics"],
    mine: true,
  });

  const channel = channelResponse.data.items?.[0];
  if (!channel || !channel.id) {
    throw new AppError("No YouTube channel found for this Google account", 404);
  }

  await SocialAccount.findOneAndUpdate(
    { owner: userId, platform: "youtube" },
    {
      $set: {
        externalAccountId: channel.id,
        displayName: channel.snippet?.title ?? "YouTube Channel",
        accessToken: tokens.access_token,
        ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
        tokenExpiresAt: new Date(tokens.expiry_date),
        lastSyncedAt: new Date(),
      },
    },
    { upsert: true, new: true },
  );

  return {
    displayName: channel.snippet?.title,
    subscriberCount: channel.statistics?.subscriberCount,
  };
}

/**
 * Vraća validan OAuth klijent za datog korisnika — automatski osvežava access token
 * ako je istekao, koristeći sačuvan refresh token.
 */
async function getAuthorizedClient(userId: string) {
  const account = await SocialAccount.findOne({
    owner: userId,
    platform: "youtube",
  }).select("+accessToken +refreshToken");
  if (!account) {
    throw new AppError("YouTube account not connected", 404);
  }

  const client = createOAuthClient();
  client.setCredentials({
    access_token: account.accessToken,
    refresh_token: account.refreshToken,
    expiry_date: account.tokenExpiresAt.getTime(),
  });

  // Ako je token istekao (ili ističe za manje od minut), osveži ga pre upotrebe
  if (account.tokenExpiresAt.getTime() < Date.now() + 60_000) {
    const { credentials } = await client.refreshAccessToken();
    client.setCredentials(credentials);

    account.accessToken = credentials.access_token!;
    account.tokenExpiresAt = new Date(credentials.expiry_date!);
    await account.save();
  }

  return client;
}

export async function getChannelStats(userId: string) {
  const client = await getAuthorizedClient(userId);
  const youtube = google.youtube({ version: "v3", auth: client });

  const response = await youtube.channels.list({
    part: ["snippet", "statistics"],
    mine: true,
  });

  const channel = response.data.items?.[0];
  if (!channel) {
    throw new AppError("Channel not found", 404);
  }

  return {
    displayName: channel.snippet?.title ?? "",
    subscriberCount: Number(channel.statistics?.subscriberCount ?? 0),
    viewCount: Number(channel.statistics?.viewCount ?? 0),
    videoCount: Number(channel.statistics?.videoCount ?? 0),
  };
}

export async function getRecentVideos(userId: string, maxResults = 5) {
  const client = await getAuthorizedClient(userId);
  const youtube = google.youtube({ version: "v3", auth: client });

  const channelResponse = await youtube.channels.list({
    part: ["contentDetails"],
    mine: true,
  });
  const uploadsPlaylistId =
    channelResponse.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

  if (!uploadsPlaylistId) {
    return [];
  }

  const playlistResponse = await youtube.playlistItems.list({
    part: ["snippet"],
    playlistId: uploadsPlaylistId,
    maxResults,
  });

  const videoIds =
    playlistResponse.data.items
      ?.map((item) => item.snippet?.resourceId?.videoId)
      .filter((id): id is string => !!id) ?? [];

  if (videoIds.length === 0) return [];

  const videosResponse = await youtube.videos.list({
    part: ["snippet", "statistics"],
    id: videoIds,
  });

  return (videosResponse.data.items ?? []).map((video) => ({
    id: video.id,
    title: video.snippet?.title ?? "",
    thumbnailUrl: video.snippet?.thumbnails?.medium?.url ?? "",
    views: Number(video.statistics?.viewCount ?? 0),
    likes: Number(video.statistics?.likeCount ?? 0),
    comments: Number(video.statistics?.commentCount ?? 0),
    publishedAt: video.snippet?.publishedAt ?? "",
  }));
}

export async function isConnected(userId: string): Promise<boolean> {
  const account = await SocialAccount.findOne({
    owner: userId,
    platform: "youtube",
  });
  return !!account;
}
