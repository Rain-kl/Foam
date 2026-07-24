import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RotateCcw } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  fetchSettings,
  updateSettings,
  type SettingsSnapshot,
} from '@/features/settings/settings-api';
import { ErrorState } from '@/shared/components/data-state';
import { cn } from '@/shared/lib/cn';

type SettingsFormValues = {
  displayName: string;
  publicApiBaseURL: string;
};

function toFormValues(snapshot: SettingsSnapshot): SettingsFormValues {
  return {
    displayName: snapshot.config.app.display_name,
    publicApiBaseURL: snapshot.config.frontend.public_api_base_url,
  };
}

export function SettingsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: ['admin-settings'],
    queryFn: fetchSettings,
  });

  const form = useForm<SettingsFormValues>({
    defaultValues: { displayName: '', publicApiBaseURL: '' },
  });

  useEffect(() => {
    if (settingsQuery.data) {
      form.reset(toFormValues(settingsQuery.data));
    }
  }, [settingsQuery.data, form]);

  const updateMutation = useMutation({
    mutationFn: async (values: SettingsFormValues) => {
      if (!settingsQuery.data) {
        throw new Error(t('errors.generic'));
      }
      return updateSettings({
        revision: settingsQuery.data.revision,
        config: {
          app: { display_name: values.displayName.trim() },
          frontend: { public_api_base_url: values.publicApiBaseURL.trim() },
        },
      });
    },
    onSuccess: async (snapshot) => {
      queryClient.setQueryData(['admin-settings'], snapshot);
      form.reset(toFormValues(snapshot));
      toast.success(t('settings.saved'));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('errors.generic'));
    },
  });

  if (settingsQuery.isError) {
    return (
      <ErrorState
        message={settingsQuery.error.message}
        onRetry={() => void settingsQuery.refetch()}
      />
    );
  }

  const snapshot = settingsQuery.data;
  const loading = settingsQuery.isPending;
  const busy = loading || updateMutation.isPending;
  const dirty = form.formState.isDirty;

  return (
    <form
      className='w-full space-y-5'
      onSubmit={form.handleSubmit((values) => updateMutation.mutate(values))}
    >
      <header className="relative sticky top-8 z-40 -mx-2 flex min-h-12 items-center justify-between gap-3 bg-background px-2 py-2 before:pointer-events-none before:absolute before:inset-x-0 before:-top-[100vh] before:h-[100vh] before:bg-background before:content-[''] lg:top-20">
        <div className='min-w-0'>
          <h1 className='text-xl font-medium'>{t('settings.title')}</h1>
          <p className='sr-only'>{t('settings.description')}</p>
        </div>
        <div className='flex shrink-0 flex-wrap items-center gap-2'>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='size-8'
            aria-label={t('common.reset')}
            disabled={busy || !dirty || !snapshot}
            onClick={() => snapshot && form.reset(toFormValues(snapshot))}
          >
            <RotateCcw />
          </Button>
          <Button type='submit' size='sm' disabled={busy || !dirty}>
            {updateMutation.isPending ? <Spinner /> : null}
            {t('common.save')}
          </Button>
        </div>
      </header>

      {loading ? (
        <div className='flex min-h-64 items-center justify-center'>
          <Spinner />
        </div>
      ) : null}

      {snapshot ? (
        <Tabs
          defaultValue='general'
          className='flex flex-col gap-7 lg:flex-row lg:items-start'
        >
          <TabsList className='flex h-auto w-full shrink-0 justify-start gap-1 overflow-visible rounded-none bg-transparent p-0 [&>span]:rounded-md [&>span]:bg-muted/70 [&>span]:shadow-none lg:sticky lg:top-[148px] lg:w-56 lg:flex-col lg:items-stretch'>
            <TabsTrigger
              className='h-9 w-full shrink-0 justify-start rounded-md px-3 text-xs data-[state=active]:font-medium'
              value='general'
            >
              {t('settings.tabs.general')}
            </TabsTrigger>
            <TabsTrigger
              className='h-9 w-full shrink-0 justify-start rounded-md px-3 text-xs data-[state=active]:font-medium'
              value='frontend'
            >
              {t('settings.tabs.frontend')}
            </TabsTrigger>
            <TabsTrigger
              className='h-9 w-full shrink-0 justify-start rounded-md px-3 text-xs data-[state=active]:font-medium'
              value='status'
            >
              {t('settings.tabs.status')}
            </TabsTrigger>
          </TabsList>

          <div className='min-w-0 flex-1'>
            <SettingsPane value='general'>
              <SettingsSection title={t('settings.general')}>
                <div className='space-y-0'>
                  <SettingsField
                    controlId='settings-display-name'
                    label={t('settings.displayName')}
                    description={t('settings.displayNameHelp')}
                  >
                    <Input
                      id='settings-display-name'
                      placeholder='Foam'
                      {...form.register('displayName')}
                    />
                  </SettingsField>
                </div>
              </SettingsSection>
            </SettingsPane>

            <SettingsPane value='frontend'>
              <SettingsSection title={t('settings.frontend')}>
                <div className='space-y-0'>
                  <SettingsField
                    controlId='settings-public-api'
                    label={t('settings.publicApiBaseURL')}
                    description={t('settings.publicApiBaseURLHelp')}
                  >
                    <Input
                      id='settings-public-api'
                      placeholder={snapshot.file_public_api_base_url}
                      {...form.register('publicApiBaseURL')}
                    />
                  </SettingsField>
                </div>
              </SettingsSection>
            </SettingsPane>

            <SettingsPane value='status'>
              <SettingsSection title={t('settings.effective')}>
                <div className='space-y-0'>
                  <SettingsReadOnly
                    label={t('settings.displayName')}
                    value={snapshot.effective.display_name}
                  />
                  <SettingsReadOnly
                    label={t('settings.publicApiBaseURL')}
                    value={snapshot.effective.public_api_base_url}
                  />
                  <SettingsReadOnly
                    label={t('settings.revision')}
                    value={String(snapshot.revision)}
                  />
                  {snapshot.updated_at ? (
                    <SettingsReadOnly
                      label={t('settings.updatedAt')}
                      value={snapshot.updated_at}
                    />
                  ) : null}
                </div>
              </SettingsSection>
            </SettingsPane>
          </div>
        </Tabs>
      ) : null}
    </form>
  );
}

function SettingsPane({
  value,
  children,
}: {
  value: string;
  children: ReactNode;
}) {
  return (
    <TabsContent
      value={value}
      forceMount
      className='m-0 space-y-8 data-[state=inactive]:hidden'
    >
      {children}
    </TabsContent>
  );
}

function SettingsSection({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className='space-y-3'>
      <div className='flex min-h-8 items-center justify-between gap-3 px-1'>
        <h2 className='text-sm font-medium tracking-tight'>{title}</h2>
        {action}
      </div>
      <div className='min-w-0 w-full'>{children}</div>
    </section>
  );
}

function SettingsField({
  controlId,
  label,
  description,
  error,
  className,
  children,
}: {
  controlId: string;
  label: string;
  description?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('min-w-0 py-4', className)}>
      <div className='grid min-w-0 gap-2.5 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] sm:items-center sm:gap-8'>
        <div className='min-w-0'>
          <div className='flex min-h-5 items-center gap-2'>
            <Label htmlFor={controlId} className='text-xs font-medium'>
              {label}
            </Label>
          </div>
          {description ? (
            <p className='mt-1 max-w-xl text-xs leading-5 text-muted-foreground'>
              {description}
            </p>
          ) : null}
          {error ? <p className='mt-1 text-xs text-destructive'>{error}</p> : null}
        </div>
        <div className='min-w-0'>{children}</div>
      </div>
    </div>
  );
}

function SettingsReadOnly({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className='min-w-0 py-4'>
      <div className='grid min-w-0 gap-2.5 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] sm:items-center sm:gap-8'>
        <div className='min-w-0'>
          <div className='text-xs font-medium'>{label}</div>
        </div>
        <div className='min-w-0 break-all text-sm font-medium'>{value}</div>
      </div>
    </div>
  );
}
