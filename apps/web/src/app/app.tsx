import { useState, useEffect, useRef } from 'react';
import { Drawnix } from '@drawnix/drawnix';
import { PlaitBoard, PlaitElement, PlaitTheme, Viewport } from '@plait/core';
import localforage from 'localforage';
import { getBoardSVGString } from '../../../../packages/drawnix/src/utils/image';
import { boardToImage } from '../../../../packages/drawnix/src/utils/common';

export type AppValue = {
  children: PlaitElement[];
  viewport?: Viewport;
  theme?: PlaitTheme;
};

const MAIN_BOARD_CONTENT_KEY = 'main_board_content';

localforage.config({
  name: 'Drawnix',
  storeName: 'drawnix_store',
  driver: [localforage.INDEXEDDB, localforage.LOCALSTORAGE],
});

export interface AppProps {
  initialValue?: AppValue;
  onChange?: (value: AppValue) => void;
  onSave?: (value: AppValue) => void;
}

export function App({ initialValue, onChange, onSave }: AppProps) {
  const [value, setValue] = useState<AppValue>({ children: [] });
  // 使用 ref 来保存最新的值，确保 onSave 总是能获取到最新状态
  const valueRef = useRef<AppValue>(value);

  const [tutorial, setTutorial] = useState(false);

  useEffect(() => {
    if (initialValue) {
      setValue(initialValue);
      valueRef.current = initialValue;
      if (initialValue.children && initialValue.children.length === 0) {
        setTutorial(true);
      }
      return;
    }
  }, [initialValue]);

  return (
    <Drawnix
      value={value.children}
      viewport={value.viewport}
      theme={value.theme}
      onChange={(val) => {
        const newValue = val as AppValue;
        setValue(newValue);
        valueRef.current = newValue; // 同步更新 ref

        if (newValue.children && newValue.children.length > 0) {
          setTutorial(false);
        }

        // 调用 onChange 回调
        if (onChange) {
          onChange(newValue);
        }
      }}
      onSave={() => {
        // 使用 ref 中的最新值进行保存
        if (onSave) {
          onSave(valueRef.current);
        }
      }}
      tutorial={tutorial}
      afterInit={(board) => {
        (window as any).drawnixApi = {
            exportImage: async (format: 'png' | 'svg') => {
                if (format === 'svg') {
                  const svg = await getBoardSVGString(board);
                  if (!svg) return '';
                  // 直接使用 btoa，浏览器会自动处理 UTF-8
                  // 对于非 ASCII 字符，需要先用 encodeURIComponent 然后转换
                  const base64 = btoa(unescape(encodeURIComponent(svg)));
                  return `data:image/svg+xml;base64,${base64}`;
                } else {
                    return await boardToImage(board, { fillStyle: 'white' });
                }
            }
        };
      }}
    ></Drawnix>
  );
}

const addDebugLog = (board: PlaitBoard, value: string) => {
  const container = PlaitBoard.getBoardContainer(board).closest(
    '.drawnix'
  ) as HTMLElement;
  let consoleContainer = container.querySelector('.drawnix-console');
  if (!consoleContainer) {
    consoleContainer = document.createElement('div');
    consoleContainer.classList.add('drawnix-console');
    container.append(consoleContainer);
  }
  const div = document.createElement('div');
  div.innerHTML = value;
  consoleContainer.append(div);
};

export default App;
