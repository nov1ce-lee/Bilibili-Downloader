import { Request, Response } from 'express';
import { bilibiliService } from '../services/bilibiliService.js';

export class VideoController {
  /**
   * Parse video info
   */
  async parse(req: Request, res: Response) {
    try {
      const { url, sessdata } = req.body;
      if (!url) {
        return res.status(400).json({ success: false, error: 'URL is required' });
      }

      const data = await bilibiliService.parseVideo(url, sessdata);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error('Parse error:', error);
      res.status(500).json({ success: false, error: error.message || '解析失败' });
    }
  }

  /**
   * Download proxy
   */
  async download(req: Request, res: Response) {
    try {
      const url = req.query.url as string;
      const title = req.query.title as string || 'video';
      const type = req.query.type as string || 'mp4'; // 'mp4' or 'mp3' or 'm4a'
      const sessdata = req.query.sessdata as string;

      if (!url) {
        return res.status(400).send('URL is required');
      }

      const streamRes = await bilibiliService.getStream(url, sessdata);

      // Set headers for download
      // Sanitize filename
      const safeTitle = title.replace(/[\\/:*?"<>|]/g, '_');
      const ext = type === 'audio' ? 'm4a' : 'mp4'; // B站 audio usually m4a
      const filename = `${safeTitle}.${ext}`;

      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      res.setHeader('Content-Type', streamRes.headers['content-type'] || 'application/octet-stream');
      
      // Pipe stream
      streamRes.data.pipe(res);
    } catch (error: any) {
      console.error('Download error:', error);
      res.status(500).send('Download failed');
    }
  }
}

export const videoController = new VideoController();
