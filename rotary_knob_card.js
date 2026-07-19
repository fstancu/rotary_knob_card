class RotaryKnobCard extends HTMLElement {
  setConfig(config) {
    if (!config.entity) {
      throw new Error("You must define an entity (input_select)");
    }
    this._config = config;

    // Creăm shadow root o singură dată
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

    this.render(rotation, currentState);
  }

  async rotateKnob(newIndex) {
    const entityId = this._config.entity;
    const options = this._hass.states[entityId].attributes.options;
    const newValue = options[newIndex];

    await this._hass.callService("input_select", "select_option", {
      entity_id: entityId,
      option: newValue,
    });
  }

  render(rotation, state) {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>
        .card-container {
          padding: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
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
        .label {
          margin-top: 20px;
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
          <div class="knob-outer">
            <div class="knob-indicator"></div>
          </div>
          <div class="label">${state}</div>
          <div class="sub-label">${this._config.name || "Rotary Control"}</div>
        </div>
      </ha-card>
    `;

    // Legăm evenimentul manual, pentru că innerHTML brut nu suportă @click
    const container = this.shadowRoot.querySelector(".card-container");
    container.addEventListener("click", () => this.handleInteraction());
  }

  handleInteraction() {
    const entityId = this._config.entity;
    const options = this._hass.states[entityId].attributes.options;
    const currentState = this._hass.states[entityId].state;
    const currentIndex = options.indexOf(currentState);
    const nextIndex = (currentIndex + 1) % options.length;
    this.rotateKnob(nextIndex);
  }

  getCardSize() {
    return 3;
  }
}

customElements.define("rotary-knob-card", RotaryKnobCard);

// Necesar ca sa apara in "Add Card" -> lista de carduri custom
window.customCards = window.customCards || [];
window.customCards.push({
  type: "rotary-knob-card",
  name: "Rotary Knob Card",
  description: "Card rotativ pentru input_select",
});
