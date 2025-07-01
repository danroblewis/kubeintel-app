import { clipboardApi } from './api-client';
import { useToast } from '@/hooks/use-toast';

// Web applications don't have quit/relaunch functionality
export const quitApp = async () => {
  console.log('Quit not available in web version');
  window.close(); // This may not work due to browser security
};

export const relaunchApp = async () => {
  console.log('Relaunch not available in web version');
  window.location.reload();
};

export const copyToClipboard = async (text: string) => {
  // use toast to notify the user
  const { toast } = useToast();
  try {
    await clipboardApi.writeText(text);
    toast({
      variant: 'default',
      title: 'Copied to clipboard',
      description: text,
    });
  } catch (error) {
    toast({
      variant: 'destructive',
      title: 'Error copying to clipboard',
      description:
        error instanceof Error ? error.message : JSON.stringify(error),
    });
  }
};
