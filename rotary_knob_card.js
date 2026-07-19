class RotaryKnobCard extends HTMLElement {
  setConfig(config) {
    if (!config.entity) {
      throw new Error("You must define an entity (input_select)");
    }
    this._config = config;

    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }
  }

  set hass(hass) {
    this._hass = hass;
    this.updateKnob();
  }

  updateKnob() {
    const entityId = this._config.entity;
    const stateObj = this._hass.states[entityId];

    if (!stateObj) {
      this.shadowRoot.innerHTML = `<ha-card><div style="padding: 16px; color: red;">Entity ${entityId} not found</div></ha-card>`;
      return;
    }

    const options = stateObj.attributes.options || [];
    const currentState = stateObj.state;
    const currentIndex = options.indexOf(currentState);
    const rotation = options.length ? (currentIndex / options.length) * 360 : 0;

    this.render(rotation, currentState, options, currentIndex);
  }

  async selectOption(newIndex) {
    const entityId = this._config.entity;
    const options = this._hass.states[entityId].attributes.options;
    const newValue = options[newIndex];

    await this._hass.callService("input_select", "select_option", {
      entity_id: entityId,
      option: newValue,
    });
  }

  render(rotation, state, options, currentIndex) {
    if (!this.shadowRoot) return;

    const knobRadius = 70; // jumatate din width/height al knob-outer (140px)
    const labelRingRadius = knobRadius + 38; // cat de departe de centru sunt etichetele

    // Generam etichetele pozitionate pe cerc in jurul butonului.
    // Unghiul 0 e sus (ca la ceas), la fel ca rotatia indicatorului.
    const labelsHtml = options
      .map((opt, i) => {
        const angleDeg = (i / options.length) * 360;
        const angleRad = (angleDeg - 90) * (Math.PI / 180); // -90 ca sa porneasca de sus
        const x = labelRingRadius * Math.cos(angleRad);
        const y = labelRingRadius * Math.sin(angleRad);
        const isActive = i === currentIndex;

        return `
          <div
            class="option-label ${isActive ? "active" : ""}"
            data-index="${i}"
            style="transform: translate(${x}px, ${y}px) translate(-50%, -50%);"
          >${opt}</div>
        `;
      })
      .join("");

    this.shadowRoot.innerHTML = `
      <style>
        .card-container {
          padding: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .knob-wrapper {
          position: relative;
          width: 220px;
          height: 220px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .knob-outer {
          width: 140px;
          height: 140px;
          border-radius: 50%;
          background: radial-gradient(circle, #444 0%, #111 100%);
          box-shadow:
            inset 2px 2px 5px rgba(255,255,255,0.1),
            5px 5px 15px rgba(0,0,0,0.5),
            -2px -2px 10px rgba(255,255,255,0.05);
          position: relative;
          transition: transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1);
          transform: rotate(${rotation}deg);
          cursor: pointer;
        }
        .knob-indicator {
          position: absolute;
          top: 10px;
          left: 66px;
          width: 8px;
          height: 20px;
          background: #03A9F4;
          border-radius: 4px;
          box-shadow: 0 0 8px #03A9F4;
        }
        .option-label {
          position: absolute;
          top: 50%;
          left: 50%;
          font-size: 0.68em;
          color: var(--secondary-text-color);
          opacity: 0.6;
          cursor: pointer;
          white-space: nowrap;
          padding: 2px 5px;
          border-radius: 4px;
          transition: opacity 0.2s, color 0.2s, background 0.2s;
          user-select: none;
        }
        .option-label:hover {
          opacity: 1;
          background: rgba(3, 169, 244, 0.15);
        }
        .option-label.active {
          opacity: 1;
          color: #03A9F4;
          font-weight: 600;
        }
        .label {
          margin-top: 8px;
          font-size: 1.4em;
          font-weight: 500;
          color: var(--primary-text-color);
        }
        .sub-label {
          font-size: 1em;
          color: var(--secondary-text-color);
          opacity: 0.7;
        }
      </style>
      <ha-card>
        <div class="card-container">
          <div class="knob-wrapper">
            <div class="knob-outer">
              <div class="knob-indicator"></div>
            </div>
            ${labelsHtml}
          </div>
          <div class="label">${state}</div>
          <div class="sub-label">${this._config.name || "Rotary Control"}</div>
        </div>
      </ha-card>
    `;

    // Click pe buton = trece la urmatoarea stare
    const knob = this.shadowRoot.querySelector(".knob-outer");
    knob.addEventListener("click", () => {
      const nextIndex = (currentIndex + 1) % options.length;
      this.selectOption(nextIndex);
    });

    // Click pe orice eticheta = sari direct pe acea stare
    this.shadowRoot.querySelectorAll(".option-label").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        const idx = parseInt(el.getAttribute("data-index"), 10);
        this.selectOption(idx);
      });
    });
  }

  getCardSize() {
    return 4;
  }
}

customElements.define("rotary-knob-card", RotaryKnobCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "rotary-knob-card",
  name: "Rotary Knob Card",
  description: "Rotary knob card for input_select entities",
});
