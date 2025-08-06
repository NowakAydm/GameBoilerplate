// Control settings types for shared usage
export interface KeyboardControls {
  up: string;
  down: string;
  left: string;
  right: string;
}

export interface TouchControls {
  panEnabled: boolean;
  rotateEnabled: boolean;
  zoomEnabled: boolean;
  panSensitivity: number;
  rotateSensitivity: number;
  zoomSensitivity: number;
}

export interface ControlSettings {
  keyboard: KeyboardControls;
  touch: TouchControls;
}
