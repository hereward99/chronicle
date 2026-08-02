import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notify } from "@/lib/notify";
import { supabase } from '@/integrations/supabase/client';
import { useChronicles } from './useChronicles';
import type { Database } from '@/integrations/supabase/types';

type OrderBy = { column: string; ascending?: boolean };

type MessageOverride = string | ((variables: Record<string, unknown>) => { title: string; description?: string });

export interface EntityCrudConfig<T = unknown> {
  /** Supabase table name. */
  table: keyof Database['public']['Tables'];
  /** React Query key prefix. */
  queryKey: string;
  /** Singular label used in toasts. */
  label: string;
  /** Plural label; defaults to `${label}s`. */
  labelPlural?: string;
  /** Chronicle id to scope the query. If undefined, falls back to currentChronicle. */
  chronicleId?: string | null;
  /** When true and no chronicle id is available, query without a chronicle filter instead of disabling. */
  allowUnscoped?: boolean;
  /** Supabase select clause; defaults to '*'. */
  select?: string;
  /** Single or multiple order clauses. */
  orderBy?: OrderBy | OrderBy[];
  /** Transform each raw row before returning it. */
  transform?: (row: unknown) => T;
  /** Whether to inject the current auth user's id into create payloads. Defaults to true. */
  injectUserId?: boolean;
  /** Additional React Query keys to invalidate on update/delete success. */
  extraInvalidate?: string[][];
  /** Async work to run before deleting the row (e.g. cascading cleanup). */
  preDelete?: (id: string) => Promise<void>;
  /** Whether deletes show an undo toast before committing. Defaults to false. */
  undoDelete?: boolean;
  /** Override the create success toast. */
  createMessage?: MessageOverride;
  /** Override the update success toast. */
  updateMessage?: MessageOverride;
  /** Override the delete success toast. */
  deleteMessage?: MessageOverride;
}

function getEntityName(variables: Record<string, unknown>): string | undefined {
  return (variables.title as string) || (variables.name as string);
}

function buildDescription(
  variables: Record<string, unknown>,
  label: string,
  labelPlural?: string
): string {
  const name = getEntityName(variables);
  const plural = labelPlural || `${label}s`;
  return name
    ? `${name} has been added to your chronicle.`
    : `A new ${plural.toLowerCase()} has been added to your chronicle.`;
}

function resolveMessage(
  override: MessageOverride | undefined,
  defaultTitle: string
): { title: string; description?: string } {
  if (typeof override === 'function') {
    return override({});
  }
  if (typeof override === 'string') {
    return { title: override };
  }
  return { title: defaultTitle };
}

/**
 * Shared CRUD factory for chronicle-scoped entities.
 *
 * Keeps every entity hook thin and consistent: the same toast wording,
 * loading/error handling, query invalidation, and optional undo/delete flow.
 * Wrappers preserve their existing public function signatures.
 */
export function useEntityCrud<T = unknown>(config: EntityCrudConfig<T>) {
  const queryClient = useQueryClient();
  const { currentChronicle } = useChronicles();

  const activeChronicleId =
    config.chronicleId === undefined
      ? currentChronicle?.id
      : config.chronicleId || undefined;

  const { data: items = [], isLoading: loading, error } = useQuery({
    queryKey: [config.queryKey, activeChronicleId],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query: any = supabase
        .from(config.table)
        .select(config.select ?? '*');

      if (activeChronicleId) {
        query = query.eq('chronicle_id', activeChronicleId);
      }

      const orderBy = config.orderBy;
      if (orderBy) {
        if (Array.isArray(orderBy)) {
          orderBy.forEach(o => {
            query = query.order(o.column, { ascending: o.ascending ?? false });
          });
        } else {
          query = query.order(orderBy.column, { ascending: orderBy.ascending ?? false });
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data || []) as unknown[];
      if (config.transform) {
        return rows.map(config.transform);
      }
      return rows as T[];
    },
    enabled: !!activeChronicleId || config.allowUnscoped === true,
  });

  const createMutation = useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const payload: Record<string, unknown> = { ...input };
      if (config.injectUserId !== false) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        payload.user_id = user.id;
      }
      const { data, error } = await supabase
        .from(config.table)
        .insert(payload as Record<string, unknown>)
        .select()
        .single();
      if (error) throw error;
      return data as T;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [config.queryKey] });
      if (typeof config.createMessage === 'function') {
        const msg = config.createMessage(variables);
        notify.success(msg.title, msg.description);
      } else if (typeof config.createMessage === 'string') {
        notify.success(config.createMessage);
      } else {
        notify.success(
          `${config.label} created`,
          buildDescription(variables, config.label, config.labelPlural)
        );
      }
    },
    onError: (error: any) => {
      notify.error(`Failed to create ${config.label.toLowerCase()}`, error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, unknown> }) => {
      const { data, error } = await supabase
        .from(config.table)
        .update(updates as Record<string, unknown>)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as T;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [config.queryKey] });
      config.extraInvalidate?.forEach(key => queryClient.invalidateQueries({ queryKey: key }));
      const msg = resolveMessage(config.updateMessage, `${config.label} updated`);
      notify.success(msg.title, msg.description);
    },
    onError: (error: any) => {
      notify.error(`Failed to update ${config.label.toLowerCase()}`, error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (config.preDelete) await config.preDelete(id);
      const { error } = await supabase.from(config.table).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [config.queryKey] });
      config.extraInvalidate?.forEach(key => queryClient.invalidateQueries({ queryKey: key }));
      const msg = resolveMessage(config.deleteMessage, `${config.label} deleted`);
      notify.success(msg.title, msg.description);
    },
    onError: (error: any) => {
      notify.error(`Failed to delete ${config.label.toLowerCase()}`, error.message);
    },
  });

  const create = async (input: Record<string, unknown>) => createMutation.mutateAsync(input);
  const update = async (id: string, updates: Record<string, unknown>) => updateMutation.mutateAsync({ id, updates });

  const remove = async (id: string) => {
    if (config.undoDelete) {
      return new Promise<void>((resolve, reject) => {
        notify.undo({
          description: `${config.label} will be deleted. Undo to keep it.`,
          perform: async () => {
            try {
              await deleteMutation.mutateAsync(id);
              resolve();
            } catch (err) {
              reject(err);
            }
          },
          onUndo: () => resolve(),
          successMessage: resolveMessage(config.deleteMessage, `${config.label} deleted`).title,
          errorMessage: `Failed to delete ${config.label.toLowerCase()}`,
        });
      });
    }
    return deleteMutation.mutateAsync(id);
  };

  const refetch = () => queryClient.invalidateQueries({ queryKey: [config.queryKey] });

  return {
    items,
    loading,
    error,
    create,
    update,
    remove,
    refetch,
    chronicleId: activeChronicleId,
  };
}
