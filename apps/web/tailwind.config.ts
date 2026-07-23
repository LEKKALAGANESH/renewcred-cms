import type { Config } from 'tailwindcss';
import { renewcredPreset } from '@renewcred/tokens';

export default {
  presets: [renewcredPreset],
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
} satisfies Config;
