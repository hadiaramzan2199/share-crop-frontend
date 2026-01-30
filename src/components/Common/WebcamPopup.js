import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  Button,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Close,
  Fullscreen,
  FullscreenExit,
  PlayArrow,
  Pause,
  Videocam,
  VideocamOff,
  Refresh,
  ZoomIn,
  ZoomOut,
  AspectRatio
} from '@mui/icons-material';

const WebcamPopup = ({ open, onClose, webcamUrl, farmName }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const containerRef = useRef(null);
  const iframeRef = useRef(null);

  // Helper function for aspect ratio width
  const getAspectRatioWidth = (ratio) => {
    switch (ratio) {
      case '4:3': return '75%';
      case '1:1': return '100%';
      case '21:9': return '100%';
      default: return '100%';
    }
  };

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if (containerRef.current.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen();
      } else if (containerRef.current.mozRequestFullScreen) {
        containerRef.current.mozRequestFullScreen();
      } else if (containerRef.current.msRequestFullscreen) {
        containerRef.current.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  // Handle play/pause
  const togglePlay = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        // Send message to iframe to control playback if supported
        iframeRef.current.contentWindow.postMessage(
          isPlaying ? 'pause' : 'play',
          '*'
        );
      } catch (error) {
        // Fallback for iframes that don't support postMessage
        console.log('Iframe control not supported');
      }
    }
    setIsPlaying(!isPlaying);
  };

  // Handle refresh
  const handleRefresh = () => {
    setIsLoading(true);
    setHasError(false);
    if (iframeRef.current) {
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = '';
      setTimeout(() => {
        iframeRef.current.src = currentSrc;
      }, 100);
    }
  };

  // Handle zoom
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  // Handle aspect ratio change
  const cycleAspectRatio = () => {
    const ratios = ['16:9', '4:3', '1:1', '21:9'];
    const currentIndex = ratios.indexOf(aspectRatio);
    setAspectRatio(ratios[(currentIndex + 1) % ratios.length]);
  };

  // Handle iframe load
  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  // Handle iframe error
  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement &&
        !document.webkitFullscreenElement &&
        !document.mozFullScreenElement &&
        !document.msFullscreenElement) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth={false}
      PaperProps={{
        style: {
          width: isMobile ? '320px' : '380px',
          height: isMobile ? '420px' : '500px',
          maxWidth: isMobile ? '320px' : '380px',
          maxHeight: isMobile ? '420px' : '500px',
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: '#000'
        }
      }}
    >
      <DialogContent sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box
          ref={containerRef}
          sx={{
            position: 'relative',
            width: '100%',
            height: '100%',
            backgroundColor: '#000',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Enhanced Header */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: isMobile ? 0.75 : 1,
              background: 'linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 100%)',
              color: 'white',
              borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
              <Videocam sx={{ fontSize: isMobile ? 16 : 18, color: '#4CAF50' }} />
              <Typography
                variant={isMobile ? "caption" : "body2"}
                sx={{ fontWeight: 600, fontFamily: 'Inter, sans-serif', fontSize: '12px' }}
              >
                {farmName ? `${farmName}` : 'Farm Webcam'}
              </Typography>
              <Chip
                label={isPlaying ? 'LIVE' : 'PAUSED'}
                size="small"
                sx={{
                  backgroundColor: isPlaying ? '#4CAF50' : '#FF9800',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '9px',
                  height: '16px',
                  '& .MuiChip-label': { px: 0.5 }
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {/* Refresh Button */}
              <IconButton
                onClick={handleRefresh}
                size="small"
                sx={{
                  color: 'white',
                  p: 0.5,
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                }}
                title="Refresh"
              >
                <Refresh sx={{ fontSize: '16px' }} />
              </IconButton>

              {/* Play/Pause Button */}
              <IconButton
                onClick={togglePlay}
                size="small"
                sx={{
                  color: 'white',
                  p: 0.5,
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                }}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause sx={{ fontSize: '16px' }} /> : <PlayArrow sx={{ fontSize: '16px' }} />}
              </IconButton>

              {/* Zoom Controls - compact on desktop */}
              <IconButton
                onClick={handleZoomOut}
                size="small"
                sx={{
                  color: 'white',
                  p: 0.5,
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                }}
                title="Zoom Out"
              >
                <ZoomOut sx={{ fontSize: '16px' }} />
              </IconButton>
              <IconButton
                onClick={handleZoomIn}
                size="small"
                sx={{
                  color: 'white',
                  p: 0.5,
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                }}
                title="Zoom In"
              >
                <ZoomIn sx={{ fontSize: '16px' }} />
              </IconButton>
              <IconButton
                onClick={cycleAspectRatio}
                size="small"
                sx={{
                  color: 'white',
                  p: 0.5,
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                }}
                title="Aspect"
              >
                <AspectRatio sx={{ fontSize: '16px' }} />
              </IconButton>

              {/* Fullscreen Button */}
              <IconButton
                onClick={toggleFullscreen}
                size="small"
                sx={{
                  color: 'white',
                  p: 0.5,
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                }}
                title="Fullscreen"
              >
                {isFullscreen ? <FullscreenExit sx={{ fontSize: '16px' }} /> : <Fullscreen sx={{ fontSize: '16px' }} />}
              </IconButton>

              {/* Close Button */}
              <IconButton
                onClick={onClose}
                size="small"
                sx={{
                  color: 'white',
                  p: 0.5,
                  '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.2)' }
                }}
                title="Close"
              >
                <Close sx={{ fontSize: '16px' }} />
              </IconButton>
            </Box>
          </Box>

          {/* Enhanced Video Container */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              background: 'linear-gradient(45deg, #0a0a0a 25%, #1a1a1a 25%, #1a1a1a 50%, #0a0a0a 50%, #0a0a0a 75%, #1a1a1a 75%, #1a1a1a)',
              backgroundSize: '20px 20px',
              overflow: 'hidden'
            }}
          >
            {webcamUrl ? (
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  transform: `scale(${zoomLevel})`,
                  transition: 'transform 0.3s ease'
                }}
              >
                {isLoading && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      zIndex: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 2
                    }}
                  >
                    <CircularProgress sx={{ color: '#4CAF50' }} />
                    <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                      Loading stream...
                    </Typography>
                  </Box>
                )}

                {hasError && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      zIndex: 10,
                      textAlign: 'center',
                      color: 'white'
                    }}
                  >
                    <VideocamOff sx={{ fontSize: 64, color: '#f44336', mb: 2 }} />
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                      Stream Unavailable
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>
                      Unable to connect to the webcam feed
                    </Typography>
                    <Button
                      variant="outlined"
                      onClick={handleRefresh}
                      sx={{
                        color: 'white',
                        borderColor: 'white',
                        '&:hover': { borderColor: '#4CAF50', color: '#4CAF50' }
                      }}
                    >
                      Try Again
                    </Button>
                  </Box>
                )}

                <iframe
                  ref={iframeRef}
                  src={webcamUrl}
                  title="Farm Webcam"
                  style={{
                    width: getAspectRatioWidth(aspectRatio),
                    height: '100%',
                    border: 'none',
                    backgroundColor: '#000',
                    borderRadius: aspectRatio === '1:1' ? '8px' : '0',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                  }}
                  allow="autoplay; fullscreen; encrypted-media"
                  allowFullScreen
                  onLoad={handleIframeLoad}
                  onError={handleIframeError}
                />

                {/* Zoom indicator */}
                {zoomLevel !== 1 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                  >
                    {Math.round(zoomLevel * 100)}%
                  </Box>
                )}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', color: 'white', p: 4 }}>
                <VideocamOff sx={{ fontSize: 64, color: '#666', mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  No Webcam Available
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                  This farm doesn't have a webcam configured.
                </Typography>
              </Box>
            )}
          </Box>

          {/* Compact Footer */}
          <Box
            sx={{
              p: isMobile ? 0.5 : 0.75,
              background: 'linear-gradient(0deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 100%)',
              color: 'white',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ fontSize: '10px', opacity: 0.9 }}>
                {isPlaying ? '🔴 LIVE' : '⏸️ PAUSED'}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '10px', opacity: 0.7 }}>
                {aspectRatio}
              </Typography>
            </Box>

            <Typography variant="caption" sx={{ fontSize: '9px', opacity: 0.5 }}>
              ESC to exit fullscreen
            </Typography>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default WebcamPopup;