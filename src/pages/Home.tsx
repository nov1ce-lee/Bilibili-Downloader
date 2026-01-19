import { useState } from 'react';
import axios from 'axios';
import { Search, Download, Loader2, Music, Video, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for tailwind classes
function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface Quality {
  quality: string;
  url: string;
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

// Custom Bilibili TV Logo with Download Arrow
function BiliLogo() {
  return (
    <div className="relative w-32 h-32 mx-auto mb-6 group cursor-default">
      {/* TV Icon */}
      <svg
        viewBox="0 0 1024 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-[#FB7299] transition-transform duration-300 group-hover:scale-105"
        fill="currentColor"
      >
        {/* Body */}
        <path d="M777.5 322.2h-140.2l49-62.8c4.3-5.6 3.3-13.6-2.3-17.9-5.6-4.3-13.6-3.3-17.9 2.3L597.6 331c-17.7 22.8-54.6 23.4-73.1 1.2l-71.5-85.8c-4.4-5.2-12.2-6-17.4-1.6-5.2 4.4-6 12.2-1.6 17.4l49.8 59.8H343.6c-48.4 0-87.7 39.3-87.7 87.7v315.7c0 48.4 39.3 87.7 87.7 87.7h433.9c48.4 0 87.7-39.3 87.7-87.7V409.9c0-48.4-39.3-87.7-87.7-87.7z m-350.8 280.6c-24.2 0-43.9-19.7-43.9-43.9s19.7-43.9 43.9-43.9 43.9 19.7 43.9 43.9-19.7 43.9-43.9 43.9z m263.2 0c-24.2 0-43.9-19.7-43.9-43.9s19.7-43.9 43.9-43.9 43.9 19.7 43.9 43.9-19.7 43.9-43.9 43.9z" />
      </svg>
      
      {/* Download Arrow */}
      <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md border border-gray-100">
        <Download className="w-5 h-5 text-[#FB7299] animate-bounce" strokeWidth={3} />
      </div>
    </div>
  );
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [sessdata, setSessdata] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<VideoInfo | null>(null);
  const [error, setError] = useState('');

  const handleParse = async () => {
    if (!url) return;
    
    // Simple validation
    if (!url.includes('bilibili.com')) {
      setError('请输入有效的B站视频链接');
      return;
    }

    setLoading(true);
    setError('');
    setData(null);

    try {
      const res = await axios.post('/api/parse', { url, sessdata });
      if (res.data.success) {
        setData(res.data.data);
      } else {
        setError(res.data.error || '解析失败');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || '网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const getDownloadLink = (targetUrl: string, type: 'video' | 'audio') => {
    if (!data) return '';
    const params = new URLSearchParams({
      url: targetUrl,
      title: data.title,
      type,
      sessdata // Pass sessdata to download link if needed for higher speed/access
    });
    return `/api/download?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <BiliLogo />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Bilibili <span className="text-[#FB7299]">Downloader</span>
          </h1>
          <p className="text-gray-500">
            B站视频解析下载工具
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-[#FB7299] focus:border-[#FB7299] transition-colors"
                placeholder="粘贴 B 站视频链接 (例如: https://www.bilibili.com/video/BV...)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleParse()}
              />
            </div>
            <button
              onClick={handleParse}
              disabled={loading || !url}
              className="flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-[#FB7299] hover:bg-[#e0668a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FB7299] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  解析中...
                </>
              ) : (
                '解析视频'
              )}
            </button>
          </div>
          
          {/* Advanced Settings */}
          <div className="mt-4 border-t border-gray-100 pt-4">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-gray-500 hover:text-[#FB7299] flex items-center transition-colors"
            >
              {showAdvanced ? '隐藏高级设置' : '显示高级设置 (SESSDATA)'}
            </button>
            
            {showAdvanced && (
              <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-xs text-gray-500 mb-1">
                  SESSDATA (可选，用于获取 1080P+/4K 画质)
                </label>
                <input
                  type="text"
                  className="block w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-[#FB7299] focus:border-[#FB7299] transition-colors"
                  placeholder="在此粘贴 SESSDATA Cookie 值"
                  value={sessdata}
                  onChange={(e) => setSessdata(e.target.value)}
                />
                <p className="mt-1 text-xs text-gray-400">
                  获取方式：浏览器按 F12 - Application - Cookies - 选择https://www.bilibili.com - 找到 SESSDATA 字段并复制值
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 rounded-xl flex items-start text-red-700">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Result Section */}
        {data && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
              {/* Cover Image */}
              <div className="w-full md:w-1/3 flex-shrink-0">
                <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden shadow-inner relative group">
                  <img 
                    src={data.cover} 
                    alt={data.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {data.duration}
                  </div>
                </div>
              </div>

              {/* Info & Actions */}
              <div className="flex-grow space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 line-clamp-2 leading-tight">
                    {data.title}
                  </h2>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <span className="font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded mr-2">
                      UP
                    </span>
                    {data.author}
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Video Downloads */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                      <Video className="w-4 h-4 mr-2 text-[#FB7299]" />
                      视频下载
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {data.qualities.map((q) => (
                        <a
                          key={q.quality}
                          href={getDownloadLink(q.url, 'video')}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center px-4 py-2 border border-gray-200 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-[#FB7299] hover:text-[#FB7299] transition-all"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          {q.quality}
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Audio Download */}
                  {data.audioUrl && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                        <Music className="w-4 h-4 mr-2 text-[#FB7299]" />
                        音频下载
                      </h3>
                      <a
                        href={getDownloadLink(data.audioUrl, 'audio')}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center px-4 py-2 border border-gray-200 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-[#FB7299] hover:text-[#FB7299] transition-all"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        下载音频 (M4A)
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Note Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 text-xs text-gray-500">
              提示：如果是高清视频，B站可能采用音视频分离策略。如果下载的视频没有声音，请单独下载音频。
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
