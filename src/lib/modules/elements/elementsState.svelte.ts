import { localSettingsService } from '../../services/localSettingsService';
import {
  ELEMENTS,
  searchElements,
  type ChemicalElement,
  type TacticalFilter
} from './elementsData';
import { settings } from '../../state/settings.svelte';

export type ElementsFlavour = 'table' | 'search';

class ElementsState {
  private modSettings = localSettingsService.forModule('elements');

  // Flavour
  activeFlavour = $state<ElementsFlavour>(
    (this.modSettings.getString('flavour', 'table') as ElementsFlavour) || 'table'
  );

  // Tactical Filter in Table mode
  tacticalFilter = $state<TacticalFilter>(
    (this.modSettings.getString('filter', 'none') as TacticalFilter) || 'none'
  );

  // Search query
  searchQuery = $state<string>(
    this.modSettings.getString('search_query', '')
  );

  // Selected element for highlight / inspection
  selectedElementZ = $state<number | null>(
    this.modSettings.getNumber('selected_z', 26) // default Fe
  );

  // Target Z for zooming in from search to table
  targetFocusZ = $state<number | null>(null);

  // Derived search matches
  searchMatches = $derived.by(() => {
    return searchElements(this.searchQuery);
  });

  // Derived selected element object
  selectedElement = $derived.by(() => {
    if (!this.selectedElementZ) return null;
    return ELEMENTS.find((e) => e.z === this.selectedElementZ) ?? null;
  });

  setFlavour(val: ElementsFlavour) {
    if (this.activeFlavour === val) return;
    settings.vibrate(20);
    this.activeFlavour = val;
    this.modSettings.setString('flavour', val);
  }

  setFilter(val: TacticalFilter) {
    settings.vibrate(20);
    this.tacticalFilter = val;
    this.modSettings.setString('filter', val);
  }

  addSearchChar(char: string) {
    this.searchQuery += char;
    this.modSettings.setString('search_query', this.searchQuery);
  }

  backspaceSearch() {
    if (this.searchQuery.length > 0) {
      this.searchQuery = this.searchQuery.slice(0, -1);
      this.modSettings.setString('search_query', this.searchQuery);
    }
  }

  clearSearch() {
    this.searchQuery = '';
    this.modSettings.setString('search_query', '');
  }

  selectElement(z: number | null) {
    this.selectedElementZ = z;
    if (z !== null) {
      this.modSettings.setNumber('selected_z', z);
    }
  }

  resetModule() {
    settings.vibrate(30);
    this.activeFlavour = 'table';
    this.tacticalFilter = 'none';
    this.searchQuery = '';
    this.selectedElementZ = null;
    this.modSettings.setString('flavour', 'table');
    this.modSettings.setString('filter', 'none');
    this.modSettings.setString('search_query', '');
  }
}

export const elementsState = new ElementsState();
