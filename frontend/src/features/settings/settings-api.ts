import { apiRequest } from '@/shared/api/client';
import {
  createValidatedDecoder,
  hasShape,
  isNumber,
  isOptional,
  isString,
  type ApiDecoder,
} from '@/shared/api/decoder';

export type SettingsSnapshot = {
  config: {
    app: { display_name: string };
    frontend: { public_api_base_url: string };
  };
  revision: number;
  updated_at?: string;
  file_public_api_base_url: string;
  effective: {
    display_name: string;
    public_api_base_url: string;
  };
};

export type SettingsUpdateInput = {
  revision: number;
  config: SettingsSnapshot['config'];
};

const decodeSettingsSnapshot: ApiDecoder<SettingsSnapshot> =
  createValidatedDecoder(
    'settings snapshot',
    hasShape({
      config: hasShape({
        app: hasShape({ display_name: isString }),
        frontend: hasShape({ public_api_base_url: isString }),
      }),
      revision: isNumber,
      file_public_api_base_url: isString,
      effective: hasShape({
        display_name: isString,
        public_api_base_url: isString,
      }),
      updated_at: isOptional(isString),
    }),
  );

export async function fetchSettings(): Promise<SettingsSnapshot> {
  return apiRequest(
    '/api/v1/admin/settings',
    { method: 'GET' },
    decodeSettingsSnapshot,
  );
}

export async function updateSettings(
  input: SettingsUpdateInput,
): Promise<SettingsSnapshot> {
  return apiRequest(
    '/api/v1/admin/settings',
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
    decodeSettingsSnapshot,
  );
}
