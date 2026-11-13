<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import {
    ArrowClockwise,
    ArrowCounterClockwise,
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    ArrowUp,
    CubeFocus,
    PencilSimple
  } from 'phosphor-svelte';
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import type { ModuleBarConfig } from '../../components/layout/ModuleBar.svelte';
  import SegmentedControl, { type SegmentOption } from '../../components/ui/SegmentedControl.svelte';
  import Chassis from '../../components/ui/Chassis.svelte';
  import Keycap from '../../components/ui/Keycap.svelte';
  import MenuGroup from '../../components/ui/MenuGroup.svelte';
  import HoldToAction from '../../components/ui/HoldToAction.svelte';
  import OptionRow from '../../components/ui/OptionRow.svelte';
  import AlphabetSelect from '../../components/ui/AlphabetSelect.svelte';
  import NonStandardAlphabetBanner from '../../components/ui/NonStandardAlphabetBanner.svelte';
  import CubeCanvas, {
    type NodePulseTrigger,
    type SwapAnimationTrigger
  } from './CubeCanvas.svelte';
  import CubeTray from './CubeTray.svelte';
  import CubeCellSheet from './CubeCellSheet.svelte';
  import CubeReference from './CubeReference.svelte';
  import {
    AXIS_LABELS,
    CUBE_TYPES,
    SHELL_FILL_OPTIONS,
    type AxisSign,
    type CubeCellValue,
    type CubeNode,
    type CubeVariant,
    type CubeViewMode,
    type GridFillOrder,
    type RotationDirection,
    type RotationMatrix,
    type ShellElementType,
    type ShellFillOrder
  } from './cubeData';
  import {
    buildCubeNodes,
    describeFrontFace,
    describeViewCoord,
    getCanonicalSlots,
    hasActiveAxisFilter,
    IDENTITY_ROTATION,
    interpolateRotationMatrix,
    isIdentityRotation,
    isValidRotationMatrix,
    matchesFilter,
    parseCubePodklad,
    rotateCube,
    serializeCubePodklad,
    type AxisFilter
  } from './cubeSolver';
  import { alphabet, type AlphabetLayout } from '../../state/alphabet.svelte';
  import { createModuleState } from '../../state/moduleState.svelte';
  import { localSettingsService } from '../../services/localSettingsService';
  import { settings } from '../../state/settings.svelte';
  import { toast } from '../../state/toast.svelte';

  const modSettings = localSettingsService.forModule('cube');

  const { state: modState, reset: resetModState } = createModuleState('cube', {
    variant: 'grid27' as CubeVariant,
    viewMode: 'wireframe' as CubeViewMode,
    gridFillOrder: 'front-row-col' as GridFillOrder,
    shellFillOrder: 'faces-edges-corners' as ShellFillOrder,
    rot_grid27: [...IDENTITY_ROTATION] as RotationMatrix,
    rot_shell26: [...IDENTITY_ROTATION] as RotationMatrix,
    custom_grid27: null as Record<string, CubeCellValue> | null,
    custom_shell26: null as Record<string, CubeCellValue> | null,
    warning_grid27: null as string | null,
    warning_shell26: null as string | null
  });

  let toolAlphabetMap = $state<Record<CubeVariant, string>>({
    grid27: modSettings.getString('alphabet:grid27', 'english-26'),
    shell26: modSettings.getString('alphabet:shell26', 'english-26')
  });

  function setToolAlphabet(variant: CubeVariant, alphabetId: string) {
    toolAlphabetMap = { ...toolAlphabetMap, [variant]: alphabetId };
    modSettings.setString('alphabet:' + variant, alphabetId);
  }

  const variantOptions: SegmentOption<CubeVariant>[] = CUBE_TYPES.map((t) => ({
    id: t.id,
    label: t.name
  }));

  const variant = $derived<CubeVariant>(modState.variant === 'shell26' ? 'shell26' : 'grid27');
  const activeConfig = $derived(CUBE_TYPES.find((t) => t.id === variant) ?? CUBE_TYPES[0]);

  const currentAlphabetId = $derived(
    toolAlphabetMap[variant] ?? activeConfig.defaultAlphabetId
  );
  const currentLayout = $derived<AlphabetLayout>(
    alphabet.getLayout(currentAlphabetId) ?? alphabet.layouts[0]
  );
  const activeLetters = $derived(currentLayout.letters);

  const isNonStandardAlphabet = $derived(
    !activeConfig.standardAlphabetIds.includes(currentAlphabetId)
  );
  const isNonStandardFill = $derived(
    variant === 'grid27'
      ? modState.gridFillOrder !== 'front-row-col'
      : modState.shellFillOrder !== 'faces-edges-corners'
  );

  const currentRot = $derived<RotationMatrix>(
    variant === 'shell26'
      ? isValidRotationMatrix(modState.rot_shell26)
        ? modState.rot_shell26
        : IDENTITY_ROTATION
      : isValidRotationMatrix(modState.rot_grid27)
        ? modState.rot_grid27
        : IDENTITY_ROTATION
  );

  const customCells = $derived<Record<string, CubeCellValue> | null>(
    variant === 'shell26' ? modState.custom_shell26 : modState.custom_grid27
  );

  const podkladWarning = $derived<string | null>(
    variant === 'shell26' ? modState.warning_shell26 : modState.warning_grid27
  );

  const slots = $derived(
    getCanonicalSlots(variant, modState.gridFillOrder, modState.shellFillOrder)
  );
  const nodes = $derived(buildCubeNodes(slots, activeLetters, customCells, currentRot));
  const nodeById = $derived.by(() => {
    const map = new Map<string, CubeNode>();
    for (const n of nodes) map.set(n.id, n);
    return map;
  });

  // Ephemeral UI state (browse filters, arrangement mode, cell editor)
  let editMode = $state(false);
  let axisFilter = $state<AxisFilter>({ x: null, y: null, z: null });
  let shellTypeFilter = $state<ShellElementType | null>(null);
  let inspectedNodeId = $state<string | null>(null);
  let selectedEditNodeId = $state<string | null>(null);
  let selectedTrayChar = $state<string | null>(null);
  let swapAnim = $state<SwapAnimationTrigger | null>(null);
  let pulseAnim = $state<NodePulseTrigger | null>(null);

  let editingNodeId = $state<string | null>(null);
  const editingNode = $derived(editingNodeId ? (nodeById.get(editingNodeId) ?? null) : null);

  let lastBrowseTap: { nodeId: string; at: number } | null = null;
  let longPressTimer: number | null = null;

  const hasFilter = $derived(
    hasActiveAxisFilter(axisFilter) || (variant === 'shell26' && shellTypeFilter !== null)
  );

  const matchedNodes = $derived(
    hasFilter
      ? nodes.filter((n) => matchesFilter(n, variant, axisFilter, shellTypeFilter))
      : nodes
  );

  const placedChars = $derived.by(() => {
    const set = new Set<string>();
    for (const n of nodes) {
      if (n.char) set.add(n.char);
    }
    return set;
  });

  const knownTags = $derived.by(() => {
    const set = new Set<string>();
    for (const n of nodes) {
      if (n.tag) set.add(n.tag);
    }
    return [...set];
  });

  // Unified single-finger drag state (node <-> node, tray -> node, node -> tray)
  type DragSource =
    | { kind: 'node'; nodeId: string; value: CubeCellValue }
    | { kind: 'tray'; char: string };

  let cubeCanvasRef = $state<ReturnType<typeof CubeCanvas> | null>(null);
  let cubeTrayRef = $state<ReturnType<typeof CubeTray> | null>(null);

  let pendingDrag: {
    source: DragSource;
    pointerId: number;
    startX: number;
    startY: number;
    isDragging: boolean;
  } | null = null;

  let activeDrag = $state<{
    source: DragSource;
    clientX: number;
    clientY: number;
    hoveredNodeId: string | null;
    hoveredTray: boolean;
  } | null>(null);

  function setCustomCells(next: Record<string, CubeCellValue> | null, warning: string | null = null) {
    if (variant === 'shell26') {
      modState.custom_shell26 = next;
      modState.warning_shell26 = warning;
    } else {
      modState.custom_grid27 = next;
      modState.warning_grid27 = warning;
    }
  }

  function materializeCells(): Record<string, CubeCellValue> {
    const out: Record<string, CubeCellValue> = {};
    for (const n of nodes) {
      out[n.id] = n.tag ? { char: n.char, tag: n.tag } : { char: n.char };
    }
    return out;
  }

  function setRotation(next: RotationMatrix) {
    if (variant === 'shell26') {
      modState.rot_shell26 = next;
    } else {
      modState.rot_grid27 = next;
    }
  }

  let renderMatrix = $state<number[]>([...IDENTITY_ROTATION]);
  let rotAnimRaf: number | null = null;

  function cancelRotationAnimation() {
    if (rotAnimRaf !== null) {
      cancelAnimationFrame(rotAnimRaf);
      rotAnimRaf = null;
    }
  }

  function animateToRotation(target: RotationMatrix) {
    cancelRotationAnimation();
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      renderMatrix = [...target];
      return;
    }

    const startMat = [...renderMatrix];
    const duration = 210;
    const startTime = performance.now();

    const tick = (now: number) => {
      const rawT = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - rawT, 3);
      renderMatrix = interpolateRotationMatrix(startMat, target, eased);
      if (rawT < 1) {
        rotAnimRaf = requestAnimationFrame(tick);
      } else {
        renderMatrix = [...target];
        rotAnimRaf = null;
      }
    };

    rotAnimRaf = requestAnimationFrame(tick);
  }

  onMount(() => {
    renderMatrix = [...currentRot];
  });

  function handleRotate(dir: RotationDirection) {
    swapAnim = null;
    pulseAnim = null;
    const next = rotateCube(currentRot, dir);
    setRotation(next);
    animateToRotation(next);
  }

  function handleResetRotation() {
    swapAnim = null;
    pulseAnim = null;
    const next = [...IDENTITY_ROTATION] as RotationMatrix;
    setRotation(next);
    animateToRotation(next);
  }

  function clearFilters() {
    axisFilter = { x: null, y: null, z: null };
    shellTypeFilter = null;
    inspectedNodeId = null;
  }

  function toggleAxis(axis: keyof AxisFilter, value: AxisSign) {
    inspectedNodeId = null;
    axisFilter = {
      ...axisFilter,
      [axis]: axisFilter[axis] === value ? null : value
    };
  }

  function toggleShellType(type: ShellElementType) {
    inspectedNodeId = null;
    shellTypeFilter = shellTypeFilter === type ? null : type;
  }

  function clearEditSelection() {
    selectedEditNodeId = null;
    selectedTrayChar = null;
  }

  function replaceCellChar(nodeId: string, char: string) {
    const next = materializeCells();
    const prev = next[nodeId];
    next[nodeId] = prev?.tag ? { char, tag: prev.tag } : { char };
    setCustomCells(next);
  }

  function swapCells(nodeAId: string, nodeBId: string) {
    if (nodeAId === nodeBId) return;
    const next = materializeCells();
    const aVal = next[nodeAId] ?? { char: '' };
    const bVal = next[nodeBId] ?? { char: '' };
    next[nodeAId] = bVal;
    next[nodeBId] = aVal;
    setCustomCells(next);
  }

  function clearLongPressTimer() {
    if (longPressTimer !== null) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  }

  function handleVariantChange(next: CubeVariant) {
    if (next === variant) return;
    cancelRotationAnimation();
    modState.variant = next;
    const target =
      next === 'shell26'
        ? isValidRotationMatrix(modState.rot_shell26)
          ? modState.rot_shell26
          : IDENTITY_ROTATION
        : isValidRotationMatrix(modState.rot_grid27)
          ? modState.rot_grid27
          : IDENTITY_ROTATION;
    renderMatrix = [...target];
    swapAnim = null;
    pulseAnim = null;
    clearFilters();
    clearEditSelection();
    lastBrowseTap = null;
    editingNodeId = null;
    cleanupDragListeners();
  }

  function toggleEditMode() {
    editMode = !editMode;
    swapAnim = null;
    pulseAnim = null;
    clearFilters();
    clearEditSelection();
    lastBrowseTap = null;
    editingNodeId = null;
    cleanupDragListeners();
  }

  function cleanupDragListeners() {
    clearLongPressTimer();
    window.removeEventListener('pointermove', onWindowPointerMove);
    window.removeEventListener('pointerup', onWindowPointerUp);
    window.removeEventListener('pointercancel', onWindowPointerCancel);
    pendingDrag = null;
    activeDrag = null;
  }

  onDestroy(() => {
    cleanupDragListeners();
    cancelRotationAnimation();
  });

  function startDragTracking(e: PointerEvent, source: DragSource) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    cleanupDragListeners();
    pendingDrag = {
      source,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      isDragging: false
    };
    if (source.kind === 'node') {
      longPressTimer = window.setTimeout(() => {
        if (!pendingDrag || pendingDrag.isDragging || pendingDrag.source.kind !== 'node') return;
        const targetNodeId = pendingDrag.source.nodeId;
        cleanupDragListeners();
        clearEditSelection();
        settings.vibrate(25);
        editingNodeId = targetNodeId;
      }, 460);
    }
    window.addEventListener('pointermove', onWindowPointerMove, { passive: false });
    window.addEventListener('pointerup', onWindowPointerUp);
    window.addEventListener('pointercancel', onWindowPointerCancel);
  }

  function updateDragTargets(clientX: number, clientY: number) {
    if (!pendingDrag) return;
    const hoveredNodeId = cubeCanvasRef?.hitTestClientPoint(clientX, clientY) ?? null;
    const hoveredTray =
      pendingDrag.source.kind === 'node' &&
      !hoveredNodeId &&
      (cubeTrayRef?.containsClientPoint(clientX, clientY) ?? false);

    activeDrag = {
      source: pendingDrag.source,
      clientX,
      clientY,
      hoveredNodeId,
      hoveredTray
    };
  }

  function onWindowPointerMove(e: PointerEvent) {
    if (!pendingDrag || e.pointerId !== pendingDrag.pointerId) return;
    if (!pendingDrag.isDragging) {
      if (Math.hypot(e.clientX - pendingDrag.startX, e.clientY - pendingDrag.startY) < 6) {
        return;
      }
      clearLongPressTimer();
      pendingDrag.isDragging = true;
      clearEditSelection();
      settings.vibrate(15);
    }
    e.preventDefault();
    updateDragTargets(e.clientX, e.clientY);
  }

  function triggerPulse(nodeId: string) {
    pulseAnim = { nodeId, seq: (pulseAnim?.seq ?? 0) + 1 };
  }

  function handleEditNodeTap(nodeId: string) {
    if (selectedTrayChar !== null) {
      replaceCellChar(nodeId, selectedTrayChar);
      triggerPulse(nodeId);
      clearEditSelection();
      settings.vibrate(25);
    } else if (selectedEditNodeId === nodeId) {
      selectedEditNodeId = null;
      settings.vibrate(15);
    } else if (selectedEditNodeId !== null) {
      const fromId = selectedEditNodeId;
      swapCells(fromId, nodeId);
      swapAnim = { aId: fromId, bId: nodeId, seq: (swapAnim?.seq ?? 0) + 1 };
      clearEditSelection();
      settings.vibrate(25);
    } else {
      selectedEditNodeId = nodeId;
      settings.vibrate(18);
    }
  }

  function handleEditTrayTap(char: string) {
    if (selectedEditNodeId !== null) {
      const targetId = selectedEditNodeId;
      replaceCellChar(targetId, char);
      triggerPulse(targetId);
      clearEditSelection();
      settings.vibrate(25);
    } else if (selectedTrayChar === char) {
      selectedTrayChar = null;
      settings.vibrate(15);
    } else {
      selectedTrayChar = char;
      settings.vibrate(18);
    }
  }

  function onWindowPointerUp(e: PointerEvent) {
    if (!pendingDrag || e.pointerId !== pendingDrag.pointerId) return;
    clearLongPressTimer();

    if (pendingDrag.isDragging && activeDrag) {
      const { source, hoveredNodeId, hoveredTray } = activeDrag;
      if (hoveredNodeId) {
        if (source.kind === 'node') {
          if (source.nodeId !== hoveredNodeId) {
            swapCells(source.nodeId, hoveredNodeId);
            settings.vibrate(25);
          }
        } else {
          replaceCellChar(hoveredNodeId, source.char);
          triggerPulse(hoveredNodeId);
          settings.vibrate(25);
        }
      } else if (source.kind === 'node' && hoveredTray) {
        replaceCellChar(source.nodeId, '');
        triggerPulse(source.nodeId);
        settings.vibrate(20);
      }
    } else {
      // Short tap without drag
      if (pendingDrag.source.kind === 'node') {
        handleEditNodeTap(pendingDrag.source.nodeId);
      } else {
        handleEditTrayTap(pendingDrag.source.char);
      }
    }

    cleanupDragListeners();
  }

  function onWindowPointerCancel() {
    cleanupDragListeners();
  }

  function handleNodePointerDown(e: PointerEvent, node: CubeNode) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    if (editMode) {
      startDragTracking(e, {
        kind: 'node',
        nodeId: node.id,
        value: node.tag ? { char: node.char, tag: node.tag } : { char: node.char }
      });
    } else {
      const now = performance.now();
      if (lastBrowseTap && lastBrowseTap.nodeId === node.id && now - lastBrowseTap.at <= 320) {
        lastBrowseTap = null;
        settings.vibrate(25);
        editMode = true;
        clearFilters();
        selectedEditNodeId = node.id;
        selectedTrayChar = null;
        return;
      }
      lastBrowseTap = { nodeId: node.id, at: now };
      settings.vibrate(18);
      inspectedNodeId = inspectedNodeId === node.id ? null : node.id;
    }
  }

  function handleChipPointerDown(e: PointerEvent, char: string) {
    if (!editMode) return;
    startDragTracking(e, { kind: 'tray', char });
  }

  function handleSaveCell(value: CubeCellValue) {
    if (!editingNodeId) return;
    const next = materializeCells();
    next[editingNodeId] = value;
    setCustomCells(next);
    triggerPulse(editingNodeId);
  }

  function handleRestoreDefaultArrangement() {
    clearEditSelection();
    pulseAnim = null;
    setCustomCells(null, null);
    toast.show('Výchozí abeceda obnovena');
  }

  function handleReset() {
    cancelRotationAnimation();
    swapAnim = null;
    pulseAnim = null;
    const curVariant = variant;
    resetModState();
    modState.variant = curVariant;
    renderMatrix = [...IDENTITY_ROTATION];
    setToolAlphabet('grid27', 'english-26');
    setToolAlphabet('shell26', 'english-26');
    editMode = false;
    clearFilters();
    clearEditSelection();
    lastBrowseTap = null;
    editingNodeId = null;
    cleanupDragListeners();
  }

  const bar = $derived.by<ModuleBarConfig>(() => {
    let status: string;
    if (activeDrag) {
      if (activeDrag.hoveredNodeId) {
        const target = nodeById.get(activeDrag.hoveredNodeId);
        status = target
          ? `Cíl: ${describeViewCoord(target.viewCoord, variant)}`
          : 'Uvolněte pro vložení';
      } else if (activeDrag.hoveredTray) {
        status = 'Uvolněte pro vyprázdnění uzlu';
      } else {
        status = 'Táhněte na cílový uzel';
      }
    } else if (editMode) {
      if (selectedEditNodeId) {
        const sel = nodeById.get(selectedEditNodeId);
        status = `Vybráno: ${sel?.char || '·'} · klepni na cíl nebo podrž`;
      } else if (selectedTrayChar) {
        status = `Vybráno: ${selectedTrayChar} · klepni na uzel`;
      } else {
        status = 'Klepni nebo táhni · podrž pro detail';
      }
    } else if (inspectedNodeId) {
      const node = nodeById.get(inspectedNodeId);
      if (node) {
        const val = node.char ? (node.tag ? `${node.char} [${node.tag}]` : node.char) : 'Prázdné';
        status = `${val} · ${describeViewCoord(node.viewCoord, variant)}`;
      } else {
        status = describeFrontFace(currentRot);
      }
    } else if (hasFilter) {
      status = `Zvýrazněno: ${matchedNodes.length} z ${nodes.length}`;
    } else {
      status = describeFrontFace(currentRot);
    }

    const isLayers = modState.viewMode === 'layers';
    return {
      empty: false,
      status,
      warning: podkladWarning,
      actions: [
        {
          label: isLayers ? '2D' : '3D',
          tone: isLayers ? 'accent' : 'neutral',
          selected: isLayers,
          alwaysVisible: true,
          ariaLabel: isLayers ? 'Přepnout na drátěný 3D model' : 'Přepnout na 2D vrstvy 3×3',
          title: isLayers ? 'Přepnout na drátěný 3D model' : 'Přepnout na 2D vrstvy 3×3',
          onClick: () => {
            modState.viewMode = isLayers ? 'wireframe' : 'layers';
          }
        },
        {
          label: editMode ? 'Ukončit úpravy' : 'Upravit',
          icon: PencilSimple,
          iconOnly: true,
          tone: editMode ? 'accent' : 'neutral',
          selected: editMode,
          alwaysVisible: true,
          title: editMode ? 'Ukončit úpravy rozložení' : 'Přerovnat krychli nebo přidat 2. příznak',
          onClick: toggleEditMode
        }
      ]
    };
  });

  const dragGhostLabel = $derived.by(() => {
    if (!activeDrag) return '';
    if (activeDrag.source.kind === 'tray') return activeDrag.source.char;
    return activeDrag.source.value.char || '·';
  });

  const dragGhostTag = $derived(
    activeDrag?.source.kind === 'node' ? activeDrag.source.value.tag : undefined
  );
</script>

<ModuleShell
  hasWarning={isNonStandardAlphabet || isNonStandardFill || !!podkladWarning}
  onReset={handleReset}
  podklad={{
    kind: 'text',
    required: false,
    empty: nodes.every((n) => !n.char.trim() && !n.tag?.trim()),
    title: 'Obsah krychle',
    description: `${activeConfig.capacity} políček oddělených čárkou, prázdné pole = dvě čárky (,,), 2. příznak za lomítkem (A/K).`,
    example: 'A,B/K,,D,E',
    placeholder: 'Např. A,B/K,,D,E',
    autocapitalize: 'characters',
    attention: podkladWarning,
    value: serializeCubePodklad(nodes),
    onSave: (val) => {
      const parsed = parseCubePodklad(val, slots, activeLetters);
      setCustomCells(parsed.cells, parsed.warning);
    }
  }}
  {bar}
>
  {#snippet menuOptions()}
    <MenuGroup title="Abeceda">
      <NonStandardAlphabetBanner
        isWarning={isNonStandardAlphabet}
        description={variant === 'grid27'
          ? 'Obvykle anglická (26) nebo s CH (27).'
          : 'Obvykle anglická (26).'}
      />
      <AlphabetSelect
        value={currentAlphabetId}
        defaultId={activeConfig.defaultAlphabetId}
        standardIds={activeConfig.standardAlphabetIds}
        onChange={(newId) => setToolAlphabet(variant, newId)}
      />
    </MenuGroup>

    <MenuGroup title="Pořadí plnění">
      {#if variant === 'grid27'}
        <OptionRow
          label="Po patrech shora dolů"
          hint="Výchozí běží zepředu dozadu po předních řezech"
          type="switch"
          checked={modState.gridFillOrder === 'top-row-col'}
          isNonStandard={modState.gridFillOrder === 'top-row-col'}
          onChange={(checked) => {
            modState.gridFillOrder = checked ? 'top-row-col' : 'front-row-col';
          }}
        />
      {:else}
        {#each SHELL_FILL_OPTIONS as opt (opt.id)}
          <OptionRow
            label={opt.label}
            hint={opt.hint}
            checked={modState.shellFillOrder === opt.id}
            isNonStandard={opt.id !== 'faces-edges-corners' && modState.shellFillOrder === opt.id}
            onChange={() => {
              modState.shellFillOrder = opt.id;
            }}
          />
        {/each}
      {/if}
    </MenuGroup>

    <HoldToAction
      onAction={handleRestoreDefaultArrangement}
      showLabel={true}
      label="Obnovit výchozí rozmístění"
      confirmedLabel="Obnoveno"
      ariaLabel="Podržte pro obnovení výchozího rozmístění"
      tapWarning="Podržte pro obnovení výchozího rozmístění"
      holdDuration={500}
      variant="menu"
    />
  {/snippet}

  {#snippet reference()}
    <CubeReference activeTool={variant} />
  {/snippet}

  {#snippet output()}
    <CubeCanvas
      bind:this={cubeCanvasRef}
      {nodes}
      {variant}
      viewMode={modState.viewMode}
      {renderMatrix}
      {axisFilter}
      {shellTypeFilter}
      {hasFilter}
      {editMode}
      {inspectedNodeId}
      selectedNodeId={selectedEditNodeId}
      {swapAnim}
      {pulseAnim}
      draggingNodeId={activeDrag?.source.kind === 'node' ? activeDrag.source.nodeId : null}
      hoveredNodeId={activeDrag?.hoveredNodeId ?? null}
      onNodePointerDown={handleNodePointerDown}
    />
  {/snippet}

  {#snippet variants()}
    <SegmentedControl
      options={variantOptions}
      value={variant}
      size="sm"
      ariaLabel="Typ krychle"
      onChange={handleVariantChange}
    />
  {/snippet}

  {#snippet input()}
    <div class="cube-controls">
      <Chassis columns={7} keyHeight="var(--control-min-height)">
        <Keycap
          size="s"
          ariaLabel="Otočit doleva"
          title="Otočit doleva o 90°"
          onPress={() => handleRotate('left')}
        >
          <ArrowLeft size={16} weight="bold" />
        </Keycap>
        <Keycap
          size="s"
          ariaLabel="Otočit nahoru"
          title="Otočit nahoru o 90°"
          onPress={() => handleRotate('up')}
        >
          <ArrowUp size={16} weight="bold" />
        </Keycap>
        <Keycap
          size="s"
          ariaLabel="Otočit dolů"
          title="Otočit dolů o 90°"
          onPress={() => handleRotate('down')}
        >
          <ArrowDown size={16} weight="bold" />
        </Keycap>
        <Keycap
          size="s"
          ariaLabel="Otočit doprava"
          title="Otočit doprava o 90°"
          onPress={() => handleRotate('right')}
        >
          <ArrowRight size={16} weight="bold" />
        </Keycap>
        <Keycap
          size="s"
          ariaLabel="Otočit čelo proti směru hodin"
          title="Otočit čelní stěnu o 90° doleva"
          onPress={() => handleRotate('roll-ccw')}
        >
          <ArrowCounterClockwise size={16} weight="bold" />
        </Keycap>
        <Keycap
          size="s"
          ariaLabel="Otočit čelo po směru hodin"
          title="Otočit čelní stěnu o 90° doprava"
          onPress={() => handleRotate('roll-cw')}
        >
          <ArrowClockwise size={16} weight="bold" />
        </Keycap>
        <Keycap
          size="s"
          ariaLabel="Výchozí pohled"
          title="Vrátit výchozí natočení"
          disabled={isIdentityRotation(currentRot)}
          onPress={handleResetRotation}
        >
          <CubeFocus size={16} weight="bold" />
        </Keycap>
      </Chassis>

      {#if editMode}
        <CubeTray
          bind:this={cubeTrayRef}
          letters={activeLetters}
          {placedChars}
          selectedChar={selectedTrayChar}
          isDropTarget={activeDrag?.hoveredTray ?? false}
          onChipPointerDown={handleChipPointerDown}
        />
      {:else if variant === 'grid27'}
        <Chassis columns={3} keyHeight="var(--control-min-height)">
          {#each [-1, 0, 1] as sign, rowIdx (sign)}
            {@const s = sign as AxisSign}
            {@const key = String(s) as '-1' | '0' | '1'}
            <Keycap
              size="s"
              label="{rowIdx + 1} {AXIS_LABELS.z[key]}"
              ariaLabel="Vrstva {AXIS_LABELS.z[key]}"
              selected={axisFilter.z === s}
              onPress={() => toggleAxis('z', s)}
            />
            <Keycap
              size="s"
              label="{rowIdx + 1} {AXIS_LABELS.y[key]}"
              ariaLabel="Řádek {AXIS_LABELS.y[key]}"
              selected={axisFilter.y === s}
              onPress={() => toggleAxis('y', s)}
            />
            <Keycap
              size="s"
              label="{rowIdx + 1} {AXIS_LABELS.x[key]}"
              ariaLabel="Sloupec {AXIS_LABELS.x[key]}"
              selected={axisFilter.x === s}
              onPress={() => toggleAxis('x', s)}
            />
          {/each}
        </Chassis>
      {:else}
        <Chassis columns={3} keyHeight="var(--control-min-height)">
          <Keycap
            size="s"
            label="Stěny (6)"
            selected={shellTypeFilter === 'face'}
            onPress={() => toggleShellType('face')}
          />
          <Keycap
            size="s"
            label="Hrany (12)"
            selected={shellTypeFilter === 'edge'}
            onPress={() => toggleShellType('edge')}
          />
          <Keycap
            size="s"
            label="Vrcholy (8)"
            selected={shellTypeFilter === 'corner'}
            onPress={() => toggleShellType('corner')}
          />

          <Keycap
            size="s"
            label="Přední"
            selected={axisFilter.z === -1}
            onPress={() => toggleAxis('z', -1)}
          />
          <Keycap
            size="s"
            label="Horní"
            selected={axisFilter.y === -1}
            onPress={() => toggleAxis('y', -1)}
          />
          <Keycap
            size="s"
            label="Levá"
            selected={axisFilter.x === -1}
            onPress={() => toggleAxis('x', -1)}
          />

          <Keycap
            size="s"
            label="Zadní"
            selected={axisFilter.z === 1}
            onPress={() => toggleAxis('z', 1)}
          />
          <Keycap
            size="s"
            label="Dolní"
            selected={axisFilter.y === 1}
            onPress={() => toggleAxis('y', 1)}
          />
          <Keycap
            size="s"
            label="Pravá"
            selected={axisFilter.x === 1}
            onPress={() => toggleAxis('x', 1)}
          />
        </Chassis>
      {/if}
    </div>
  {/snippet}
</ModuleShell>

{#if activeDrag}
  <div
    class="drag-ghost"
    style:left="{activeDrag.clientX}px"
    style:top="{activeDrag.clientY - 28}px"
    aria-hidden="true"
  >
    <span class="ghost-char">{dragGhostLabel}</span>
    {#if dragGhostTag}
      <span class="ghost-tag">{dragGhostTag.slice(0, 2)}</span>
    {/if}
  </div>
{/if}

<CubeCellSheet
  open={editingNode !== null}
  coordLabel={editingNode ? describeViewCoord(editingNode.viewCoord, variant) : ''}
  initialValue={editingNode
    ? editingNode.tag
      ? { char: editingNode.char, tag: editingNode.tag }
      : { char: editingNode.char }
    : { char: '' }}
  {knownTags}
  onSave={handleSaveCell}
  onClose={() => (editingNodeId = null)}
/>

<style>
  .cube-controls {
    display: flex;
    flex-direction: column;
    gap: var(--zone-input-gap);
    width: 100%;
  }

  .drag-ghost {
    position: fixed;
    transform: translate(-50%, -50%);
    min-width: 40px;
    height: 40px;
    padding: 0 var(--space-xs);
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-surface-3);
    border: 2px solid var(--color-accent-primary);
    border-radius: var(--radius-full);
    box-shadow: var(--glow-accent);
    color: var(--color-text-primary);
    font-family: var(--font-mono);
    font-size: var(--text-base);
    font-weight: 700;
    pointer-events: none;
    z-index: 300;
  }

  .ghost-tag {
    position: absolute;
    top: -4px;
    right: -4px;
    padding: 1px 4px;
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-accent-warning);
    border-radius: var(--radius-xs);
    color: var(--color-accent-warning);
    font-size: 9px;
    line-height: 1;
  }
</style>
