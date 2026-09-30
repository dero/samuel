<div class="reference-content">
  <section class="ref-section">
    <h3 class="ref-heading">Želva & Plotter</h3>
    <p class="ref-text">
      Vizuální modul pro kreslení trajektorií ze šifrovacích zadání (jazyk Logo, želví grafika, krokování na čtverečkovaném papíře).
    </p>
  </section>

  <section class="ref-section">
    <h3 class="ref-heading">1. Režim Úhly</h3>
    <p class="ref-text">
      Relativní pohyb podle aktuální orientace želvy:
    </p>
    <div class="notation-box">
      <div class="notation-item">
        <strong>Vpřed / Vzad:</strong> Posun o 1 jednotku ve směru pohledu želvy (nebo opačně).
      </div>
      <div class="notation-item">
        <strong>Vlevo / Vpravo:</strong> Otočení na místě o zvolenou granularitu.
      </div>
      <div class="notation-item">
        <strong>Granularita (1°, 5°, 15°, 45°, 90°):</strong> Nastavuje krok otáčení. Složený úhel lze rychle poskládat (např. <code>64° = 45° + 15° + 4×1°</code>).
      </div>
    </div>
  </section>

  <section class="ref-section">
    <h3 class="ref-heading">2. Režim Směry</h3>
    <p class="ref-text">
      Absolutní krokování na mřížce v 8 směrech (světové strany a diagonály):
    </p>
    <div class="table-wrapper">
      <table class="ref-table">
        <thead>
          <tr>
            <th>Zkratka</th>
            <th>Směr</th>
            <th>Úhel</th>
            <th>Posun (X, Y)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>S</strong></td>
            <td>Sever (Nahoru)</td>
            <td>0°</td>
            <td>(0, +1)</td>
          </tr>
          <tr>
            <td><strong>SV</strong></td>
            <td>Severovýchod</td>
            <td>45°</td>
            <td>(+1, +1)</td>
          </tr>
          <tr>
            <td><strong>V</strong></td>
            <td>Východ (Doprava)</td>
            <td>90°</td>
            <td>(+1, 0)</td>
          </tr>
          <tr>
            <td><strong>JV</strong></td>
            <td>Jihovýchod</td>
            <td>135°</td>
            <td>(+1, -1)</td>
          </tr>
          <tr>
            <td><strong>J</strong></td>
            <td>Jih (Dolů)</td>
            <td>180°</td>
            <td>(0, -1)</td>
          </tr>
          <tr>
            <td><strong>JZ</strong></td>
            <td>Jihozápad</td>
            <td>225°</td>
            <td>(-1, -1)</td>
          </tr>
          <tr>
            <td><strong>Z</strong></td>
            <td>Západ (Doleva)</td>
            <td>270°</td>
            <td>(-1, 0)</td>
          </tr>
          <tr>
            <td><strong>SZ</strong></td>
            <td>Severozápad</td>
            <td>315°</td>
            <td>(-1, +1)</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <section class="ref-section">
    <h3 class="ref-heading">3. Značky a Pero</h3>
    <div class="notation-box">
      <div class="notation-item">
        <strong>📍 Značka (1, 2, 3…):</strong> Položí na aktuální souřadnici očíslovaný žlutý terčík. Skvělé pro označování křižovatek, písmen nebo stanovišť v bludišti.
      </div>
      <div class="notation-item">
        <strong>✎ Pero (Kreslí / Zvednuto):</strong> Při zvednutém peru se provede přesun bez kreslení plné čáry (zobrazí se pouze tenká orientační čárkovaná stopa).
      </div>
      <div class="notation-item">
        <strong>⌫ Undo:</strong> Vrátí poslední provedenou akci (krok, otočku, změnu pera nebo značku).
      </div>
    </div>
  </section>
</div>

<style>
  .reference-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
    color: var(--color-text-primary);
  }

  .ref-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .ref-heading {
    margin: 0;
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--color-accent-primary);
  }

  .ref-text {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    line-height: 1.5;
  }

  .notation-item code {
    background-color: var(--color-surface-2);
    padding: 2px 6px;
    border-radius: var(--radius-xs);
    font-family: var(--font-mono);
    font-size: 0.9em;
    color: var(--color-text-primary);
    border: 1px solid var(--color-border-subtle);
  }

  .notation-box {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .notation-item {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    line-height: 1.45;
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    padding: var(--space-sm);
  }

  .notation-item strong {
    color: var(--color-text-primary);
  }

  .table-wrapper {
    overflow-x: auto;
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
  }

  .ref-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--text-xs);
    text-align: left;
  }

  .ref-table th,
  .ref-table td {
    padding: 6px 10px;
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .ref-table th {
    background-color: var(--color-surface-2);
    color: var(--color-text-secondary);
    font-weight: 700;
  }

  .ref-table tr:last-child td {
    border-bottom: none;
  }
</style>
