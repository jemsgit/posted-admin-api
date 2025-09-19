export interface GrabberSettings {
  modulePath: string;
  times: string;
  hasDraft?: boolean;
}

export interface GrabberFile {
  fileName: string;
  content: string;
}

export interface GrabberFilesResponse {
  grabbers: GrabberFile[];
}

export interface GrabberContentResponseDTO {
  content: string[];
}
