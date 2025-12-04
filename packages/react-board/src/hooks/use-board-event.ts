import {
  BoardTransforms,
  PlaitBoard,
  ZOOM_STEP,
  initializeViewBox,
  initializeViewportContainer,
  isFromViewportChange,
  setIsFromViewportChange,
  updateViewportByScrolling,
  updateViewportOffset,
} from '@plait/core';
import { useEventListener } from 'ahooks';
import { useEffect, useRef } from 'react';

const useBoardEvent = (
  board: PlaitBoard,
  viewportContainerRef: React.RefObject<HTMLDivElement>
) => {
  useEventListener(
    'scroll',
    (event) => {
      if (isFromViewportChange(board)) {
        setIsFromViewportChange(board, false);
      } else {
        const { scrollLeft, scrollTop } = event.target as HTMLElement;
        updateViewportByScrolling(board, scrollLeft, scrollTop);
      }
    },
    { target: viewportContainerRef }
  );

  useEventListener(
    'contextmenu',
    (event) => {
      event.preventDefault();
    },
    { target: viewportContainerRef }
  );

  useEventListener(
    'wheel',
    (event) => {
      // Credits to excalidraw
      // https://github.com/excalidraw/excalidraw/blob/b7d7ccc929696cc17b4cc34452e4afd846d59f4f/src/components/App.tsx#L9060
      if (event.metaKey || event.ctrlKey) {
        event.preventDefault();
        const { deltaX, deltaY } = event;
        const zoom = board.viewport.zoom;
        const sign = Math.sign(deltaY);
        const MAX_STEP = ZOOM_STEP * 100;
        const absDelta = Math.abs(deltaY);
        let delta = deltaY;
        if (absDelta > MAX_STEP) {
          delta = MAX_STEP * sign;
        }
        let newZoom = zoom - delta / 100;
        // increase zoom steps the more zoomed-in we are (applies to >100% only)
        newZoom +=
          Math.log10(Math.max(1, zoom)) *
          -sign *
          // reduced amplification for small deltas (small movements on a trackpad)
          Math.min(1, absDelta / 20);
        BoardTransforms.updateZoom(
          board,
          newZoom,
          PlaitBoard.getMovingPointInBoard(board)
        );
      }
    },
    { target: viewportContainerRef, passive: false }
  );

  const isInitialized = useRef(false);
  const lastScrollPosition = useRef({ scrollLeft: 0, scrollTop: 0 });

  // 保存滚动位置
  useEffect(() => {
    const container = viewportContainerRef.current;
    if (!container) return;

    const saveScrollPosition = () => {
      if (container.scrollLeft !== 0 || container.scrollTop !== 0) {
        lastScrollPosition.current = {
          scrollLeft: container.scrollLeft,
          scrollTop: container.scrollTop,
        };
      }
    };

    // 定期保存滚动位置
    const interval = setInterval(saveScrollPosition, 500);
    container.addEventListener('scroll', saveScrollPosition);

    return () => {
      clearInterval(interval);
      container.removeEventListener('scroll', saveScrollPosition);
    };
  }, [viewportContainerRef]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      if (!isInitialized.current) {
        isInitialized.current = true;
        return;
      }
      
      const entry = entries[0];
      const { width, height } = entry.contentRect;
      
      // 如果容器尺寸为 0，说明被隐藏了，不处理
      if (width === 0 || height === 0) {
        return;
      }

      // 保存当前 viewport
      const currentViewport = { ...board.viewport };
      const savedScroll = { ...lastScrollPosition.current };
      
      initializeViewportContainer(board);
      initializeViewBox(board);
      updateViewportOffset(board);
      
      // 恢复 viewport 和滚动位置
      if (currentViewport.zoom && currentViewport.origination) {
        board.viewport = currentViewport;
        updateViewportOffset(board);
      }
      
      // 使用 requestAnimationFrame 确保在下一帧恢复滚动位置
      // 这是解决 display:none 恢复后滚动条位置错误的关键
      requestAnimationFrame(() => {
        const container = viewportContainerRef.current;
        if (container && (savedScroll.scrollLeft !== 0 || savedScroll.scrollTop !== 0)) {
          container.scrollLeft = savedScroll.scrollLeft;
          container.scrollTop = savedScroll.scrollTop;
        }
      });
    });
    resizeObserver.observe(PlaitBoard.getBoardContainer(board));
    return () => {
      resizeObserver && (resizeObserver as ResizeObserver).disconnect();
    };
  }, [viewportContainerRef]);
};

export default useBoardEvent;
