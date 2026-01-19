import axios from 'axios';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const REFERER = 'https://www.bilibili.com';

interface Quality {
  quality: string;
  url: string;
  size?: string; // B站API通常不直接返回大小，需要HEAD请求获取，这里暂时可选
}

interface VideoInfo {
  title: string;
  cover: string;
  duration: string;
  author: string;
  bvId: string;
  qualities: Quality[];
  audioUrl?: string;
}

export class BilibiliService {
  /**
   * Extract BV ID from URL
   */
  private extractBvId(url: string): string | null {
    const match = url.match(/(BV[0-9A-Za-z]{10})/);
    return match ? match[1] : null;
  }

  /**
   * Format duration (seconds -> MM:SS or HH:MM:SS)
   */
  private formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  /**
   * Parse Bilibili video
   */
  async parseVideo(url: string, sessdata?: string): Promise<VideoInfo> {
    const bvId = this.extractBvId(url);
    if (!bvId) {
      throw new Error('无效的B站视频链接');
    }

    // 1. Get Video Basic Info (View)
    const viewUrl = `https://api.bilibili.com/x/web-interface/view?bvid=${bvId}`;
    const viewRes = await axios.get(viewUrl, {
      headers: { 'User-Agent': USER_AGENT }
    });

    if (viewRes.data.code !== 0) {
      throw new Error(viewRes.data.message || '获取视频信息失败');
    }

    const videoData = viewRes.data.data;
    const cid = videoData.cid; // Default to first page
    const title = videoData.title;
    const cover = videoData.pic;
    const author = videoData.owner.name;
    const duration = this.formatDuration(videoData.duration);

    // 2. Get Play URL
    // fnval=16 means DASH format (usually better quality, separate audio/video)
    // qn=80 means 1080P
    // Try to optimize for higher quality without login:
    // fnval=4048 (16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048)
    // fourk=1 requests 4K
    const playUrl = `https://api.bilibili.com/x/player/playurl?bvid=${bvId}&cid=${cid}&qn=80&fnval=4048&fourk=1`;
    
    const headers: Record<string, string> = {
      'User-Agent': USER_AGENT,
      'Referer': REFERER,
    };

    if (sessdata) {
      headers['Cookie'] = `SESSDATA=${sessdata}`;
    }

    const playRes = await axios.get(playUrl, { headers });

    if (playRes.data.code !== 0) {
      throw new Error(playRes.data.message || '获取下载地址失败');
    }

    const playData = playRes.data.data;
    const qualities: Quality[] = [];
    let audioUrl = '';

    if (playData.dash) {
      // Handle DASH format
      const dash = playData.dash;
      
      // Get Audio (usually the first one is best)
      if (dash.audio && dash.audio.length > 0) {
        audioUrl = dash.audio[0].baseUrl || dash.audio[0].backupUrl[0];
      }

      // Get Videos (map different qualities)
      // Bilibili quality codes: 80->1080P, 64->720P, 32->480P, 16->360P
      const qualityMap: Record<number, string> = {
        112: '1080P+',
        80: '1080P',
        64: '720P',
        32: '480P',
        16: '360P'
      };

      // Filter unique qualities (dash.video may contain multiple codecs for same quality)
      const seenQualities = new Set<number>();
      
      if (dash.video) {
        for (const v of dash.video) {
          if (!seenQualities.has(v.id)) {
            seenQualities.add(v.id);
            qualities.push({
              quality: qualityMap[v.id] || `${v.id}P`,
              url: v.baseUrl || v.backupUrl[0]
            });
          }
        }
      }
    } else if (playData.durl) {
      // Handle Legacy FLV/MP4 format
      // Usually contains audio and video merged
      const durl = playData.durl[0];
      qualities.push({
        quality: 'Default',
        url: durl.url
      });
      // For durl, audio is included, but we can't separate it easily without ffmpeg
      // We'll leave audioUrl empty or set it to same if we want to support "extract audio" logic later
    }

    return {
      title,
      cover,
      duration,
      author,
      bvId,
      qualities,
      audioUrl
    };
  }

  /**
   * Get stream for download proxy
   */
  async getStream(url: string, sessdata?: string) {
    const headers: Record<string, string> = {
      'User-Agent': USER_AGENT,
      'Referer': REFERER
    };

    if (sessdata) {
      headers['Cookie'] = `SESSDATA=${sessdata}`;
    }

    return axios.get(url, {
      responseType: 'stream',
      headers
    });
  }
}

export const bilibiliService = new BilibiliService();
