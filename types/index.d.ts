declare interface IBitrate{
  video?: number,
  min?: number,
  max?: number,
  audio?: number
}

declare interface IOption{
  overwrite?: boolean,
  timeLength?: string,
  framerate?: number,
  probesize?: number,
  threadQueue?: number,
  size?: string,
  videoEncodingOptions?: string | null,
  bits10?: boolean,
  mouse?: boolean,
  audioInterface?: string | null,
  audioDelay?: number,
  audioEncodingOptions?: string | null,
  bitrate?: IBitrate 
}

export function hwencode(filePath: string, codec: string, option?: IOption): Promise<string>;