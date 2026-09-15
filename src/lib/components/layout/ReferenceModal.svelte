<script lang="ts">
  import { navigation } from '../../state/navigation.svelte';
  import BottomSheet from '../ui/BottomSheet.svelte';
  import { BookOpen } from 'phosphor-svelte';

  interface Props {
    title?: string;
    children?: import('svelte').Snippet;
  }

  let { title, children }: Props = $props();

  let sheetTitle = $derived(
    title ?? (navigation.activeModule?.name ? `Reference: ${navigation.activeModule.name}` : 'Reference a tahák')
  );
</script>

<BottomSheet
  open={navigation.subView === 'ref'}
  title={sheetTitle}
  icon={BookOpen}
  maxWidth="680px"
  height="85vh"
  scrollable={false}
  padding={false}
  onClose={() => navigation.closeSubView()}
>
  {#if children}
    <div class="ref-wrapper">
      {@render children()}
    </div>
  {:else}
    <div class="empty-ref">
      <p>Zde bude referenční přehled a tahák pro tento modul.</p>
    </div>
  {/if}
</BottomSheet>

<style>
  .ref-wrapper {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    height: 100%;
    padding: var(--space-md) var(--space-lg) var(--space-lg);
    overflow: hidden;
    box-sizing: border-box;
  }

  .empty-ref {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-2xl) var(--space-md);
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
    text-align: center;
  }
</style>
