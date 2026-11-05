import {
  agentErrorResponse,
  agentResponse,
  errorResponse,
  validationErrorResponse,
} from '@/app/api/_lib/http';
import { transcribeFormSchema } from '@/lib/agents/schemas';
import type { Transcript } from '@/lib/flow/types';
import { transcribeSpeech } from '@/lib/xai/speech';

const HTTP_BAD_REQUEST = 400;
const HTTP_PAYLOAD_TOO_LARGE = 413;
const HTTP_UNSUPPORTED_MEDIA = 415;
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
const DEFAULT_FILENAME = 'idea.webm';
const ALLOWED_TYPE_PREFIXES = ['audio/', 'video/webm', 'video/mp4', 'video/ogg'];
const UNTYPED_MIME_TYPES = ['', 'application/octet-stream'];

function isAudioType(type: string): boolean {
  if (UNTYPED_MIME_TYPES.includes(type)) {
    return true;
  }

  return ALLOWED_TYPE_PREFIXES.some((prefix) => type.startsWith(prefix));
}

function formField(form: FormData, name: string): FormDataEntryValue | undefined {
  const value = form.get(name);

  if (value === null) {
    return undefined;
  }

  return value;
}

export async function POST(request: Request): Promise<Response> {
  let form: FormData;

  try {
    form = await request.formData();
  } catch {
    return errorResponse(HTTP_BAD_REQUEST, {
      code: 'invalid_form',
      message: 'Send the recording as multipart form data in the field "audio".',
      retryable: false,
    });
  }

  const audioField = formField(form, 'audio');
  const languageField = formField(form, 'language');
  const parsed = transcribeFormSchema.safeParse({ audio: audioField, language: languageField });

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  const audio = parsed.data.audio;

  if (audio.size === 0 || audio.size > MAX_AUDIO_BYTES) {
    return errorResponse(HTTP_PAYLOAD_TOO_LARGE, {
      code: 'validation_error',
      message: 'The recording must be between 1 byte and 10 MB.',
      retryable: false,
    });
  }

  if (!isAudioType(audio.type)) {
    return errorResponse(HTTP_UNSUPPORTED_MEDIA, {
      code: 'validation_error',
      message: 'The recording must be an audio file.',
      retryable: false,
    });
  }

  try {
    const filename = audio.name || DEFAULT_FILENAME;
    const result = await transcribeSpeech({
      audio,
      filename,
      language: parsed.data.language,
      signal: request.signal,
    });
    const transcript: Transcript = { text: result.text };
    return agentResponse({ data: transcript, usage: [result.usage] });
  } catch (error) {
    return agentErrorResponse('voice', error);
  }
}
