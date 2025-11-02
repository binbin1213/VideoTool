import { useState } from 'react';
import type { VideoInfo } from '../../../../../types/transcode.types';

const { ipcRenderer } = (window as any).electron;

export const useVideoInfo = () => {
  const [videoFile, setVideoFile] = useState<string>('');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectVideo = async () => {
    try {
      setLoading(true);
      setError(null);

      const filePath = await ipcRenderer.invoke('select-video-file');
      if (!filePath) {
        setLoading(false);
        return null;
      }

      setVideoFile(filePath);

      // 获取视频信息
      try {
        const info = await ipcRenderer.invoke('get-video-info', filePath);
        setVideoInfo(info);
        setLoading(false);
        return info;
      } catch (err: any) {
        const errorMsg = `获取视频信息失败: ${err.message}`;
        setError(errorMsg);
        setLoading(false);
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = `选择文件失败: ${err.message}`;
      setError(errorMsg);
      setLoading(false);
      throw new Error(errorMsg);
    }
  };

  const clearVideo = () => {
    setVideoFile('');
    setVideoInfo(null);
    setError(null);
  };

  return {
    videoFile,
    videoInfo,
    loading,
    error,
    selectVideo,
    clearVideo,
  };
};

