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

    // knob_size = diametrul knob-ului in px; restul se scaleaza proportional din el
    const knobSize = this._config.knob_size || 140;
    const knobRadius = knobSize / 2;
    const labelGap = this._config.label_gap ?? 34; // distanta intre marginea knob-ului si inelul de etichete
    const labelRingRadius = knobRadius + labelGap;
    const labelMaxWidth = this._config.label_max_width || 92;
    const showLabels = this._config.show_labels !== false;
    const showState = this._config.show_state !== false;
    const showName = this._config.show_name !== false;
    const padding = this._config.padding ?? 24;

    // wrapper-ul trebuie sa incapa knob-ul + inelul de etichete (doar daca etichetele sunt vizibile)
    const wrapperExtent = showLabels ? (labelRingRadius + labelMaxWidth) * 2 : knobSize;
    const wrapperWidth = showLabels ? wrapperExtent : knobSize;
    const wrapperHeight = showLabels ? Math.max(knobSize, labelRingRadius * 2 + 40) : knobSize;

    const labelsHtml = !showLabels ? "" : options
      .map((opt, i) => {
        const angleDeg = (i / options.length) * 360;
        const angleRad = (angleDeg - 90) * (Math.PI / 180);
        const x = labelRingRadius * Math.cos(angleRad);
        const y = labelRingRadius * Math.sin(angleRad);
        const isActive = i === currentIndex;

        // cos > 0.3  -> eticheta e in dreapta -> aliniem text la stanga (creste spre dreapta)
        // cos < -0.3 -> eticheta e in stanga  -> aliniem text la dreapta (creste spre stanga)
        // altfel (sus/jos) -> centrat
        const cosVal = Math.cos(angleRad);
        let textAlign = "center";
        let translateX = "-50%";
        if (cosVal > 0.3) {
          textAlign = "left";
          translateX = "0%";
        } else if (cosVal < -0.3) {
          textAlign = "right";
          translateX = "-100%";
        }

        return `
          <div
            class="option-label ${isActive ? "active" : ""}"
            data-index="${i}"
            style="
              transform: translate(${x}px, ${y}px) translate(${translateX}, -50%);
              text-align: ${textAlign};
              max-width: ${labelMaxWidth}px;
            "
          >${opt}</div>
        `;
      })
      .join("");

    this.shadowRoot.innerHTML = `
      <style>
        .card-container {
          padding: ${padding}px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .knob-wrapper {
          position: relative;
          width: ${wrapperWidth}px;
          height: ${wrapperHeight}px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .knob-outer {
          width: ${knobSize}px;
          height: ${knobSize}px;
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
          flex-shrink: 0;
        }
        .knob-indicator {
          position: absolute;
          top: ${knobSize * 0.0714}px;
          left: ${knobSize / 2 - 4}px;
          width: 8px;
          height: ${knobSize * 0.143}px;
          background: #03A9F4;
          border-radius: 4px;
          box-shadow: 0 0 8px #03A9F4;
        }
        .option-label {
          position: absolute;
          top: 50%;
          left: 50%;
          font-size: 0.62em;
          line-height: 1.25;
          color: var(--secondary-text-color);
          opacity: 0.55;
          cursor: pointer;
          padding: 2px 5px;
          border-radius: 4px;
          transition: opacity 0.2s, color 0.2s, background 0.2s;
          user-select: none;
          word-break: break-word;
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
          margin-top: 4px;
          font-size: 1.4em;
          font-weight: 500;
          color: var(--primary-text-color);
          text-align: center;
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
          ${showState ? `<div class="label">${state}</div>` : ""}
          ${showName ? `<div class="sub-label">${this._config.name || "Rotary Control"}</div>` : ""}
        </div>
      </ha-card>
    `;

    const knob = this.shadowRoot.querySelector(".knob-outer");
    knob.addEventListener("click", () => {
      const nextIndex = (currentIndex + 1) % options.length;
      this.selectOption(nextIndex);
    });

    this.shadowRoot.querySelectorAll(".option-label").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        const idx = parseInt(el.getAttribute("data-index"), 10);
        this.selectOption(idx);
      });
    });
  }

  getCardSize() {
    const knobSize = this._config?.knob_size || 140;
    const showLabels = this._config?.show_labels !== false;
    const padding = this._config?.padding ?? 24;
    const height = (showLabels ? Math.max(knobSize, (knobSize / 2 + (this._config?.label_gap ?? 34)) * 2 + 40) : knobSize) + padding * 2 + 60;
    return Math.max(1, Math.round(height / 50));
  }
}

customElements.define("rotary-knob-card", RotaryKnobCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "rotary-knob-card",
  name: "Rotary Knob Card",
  description: "Rotary knob card for input_select entities",
});
