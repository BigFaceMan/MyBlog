import { onMounted, ref } from "vue";

export function useAsyncState<T>(loader: () => Promise<T>, immediate = true) {
  const data = ref<T | null>(null);
  const loading = ref(false);
  const error = ref("");

  const execute = async () => {
    loading.value = true;
    error.value = "";

    try {
      data.value = await loader();
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Load failed";
    } finally {
      loading.value = false;
    }
  };

  if (immediate) {
    onMounted(execute);
  }

  return {
    data,
    loading,
    error,
    execute
  };
}
