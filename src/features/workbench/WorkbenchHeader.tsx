import {
  History,
  Minimize2,
  PanelRightClose,
  PanelRightOpen,
  Settings,
  X
} from "lucide-react";
import type { LayoutMode } from "./workbench-types";

export function WorkbenchHeader(props: {
  mode: LayoutMode;
  onModeChange: (mode: LayoutMode) => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onMinimize: () => void;
  onClose: () => void;
  onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
}) {
  const nextMode = props.mode === "float" ? "dock" : "float";
  const modeLabel = nextMode === "dock" ? "停靠到右侧" : "恢复悬浮";
  const ModeIcon = nextMode === "dock" ? PanelRightOpen : PanelRightClose;

  return (
    <header className="workbench-header" onPointerDown={props.onPointerDown}>
      <div className="workbench-title">
        <span className="brand-mark">H</span>
        <div>
          <strong>视觉分析</strong>
          <span>Hhh Prompt Studio</span>
        </div>
      </div>
      <div className="icon-actions">
        <button type="button" aria-label="分析历史" title="分析历史" onClick={props.onOpenHistory}>
          <History size={17} />
        </button>
        <button type="button" aria-label="打开设置" title="打开设置" onClick={props.onOpenSettings}>
          <Settings size={17} />
        </button>
        <button
          type="button"
          aria-label={modeLabel}
          title={modeLabel}
          onClick={() => props.onModeChange(nextMode)}
        >
          <ModeIcon size={17} />
        </button>
        <button type="button" aria-label="最小化" title="最小化" onClick={props.onMinimize}>
          <Minimize2 size={17} />
        </button>
        <button type="button" aria-label="关闭" title="关闭" onClick={props.onClose}>
          <X size={17} />
        </button>
      </div>
    </header>
  );
}
