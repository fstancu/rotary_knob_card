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

    const knobRadius = 70;
    const labelRingRadius = knobRadius + 34;
    const labelMaxWidth = 92; // latime maxima per eticheta, restul face wrap pe 2 linii

    const labelsHtml = options
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
          padding: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .knob-wrapper {
          position: relative;
          width: 320px;
          height: 260px;
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
          flex-shrink: 0;
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
          <div class="label">${state}</div>
          <div class="sub-label">${this._config.name || "Rotary Control"}</div>
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
