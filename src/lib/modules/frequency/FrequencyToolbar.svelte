<script lang="ts">
  import SegmentedControl, { type SegmentOption } from '../../components/ui/SegmentedControl.svelte';

  interface Props {
    sortBy: 'freq' | 'alpha';
    onSortChange: (sort: 'freq' | 'alpha') => void;
  }

  let { sortBy, onSortChange }: Props = $props();

  const SORT_SEGMENT_OPTIONS: SegmentOption<'freq' | 'alpha'>[] = [
    { id: 'freq', label: 'Četnost ▾' },
    { id: 'alpha', label: 'Abecedně' }
  ];
</script>

<!-- The text itself is the podklad (header icon); only the live sort stays here -->
<div class="zone-input-flow">
  <div class="subtoolbar-container">
    <SegmentedControl
      options={SORT_SEGMENT_OPTIONS}
      value={sortBy}
      size="sm"
      onChange={onSortChange}
      ariaLabel="Řazení frekvenční analýzy"
    />
  </div>
</div>
