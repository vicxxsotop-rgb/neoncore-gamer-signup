(() => {
  "use strict";

  /* ----------------------------------------------------------------------
     Elements
     ---------------------------------------------------------------------- */

  const form = document.getElementById("signup-form");
  const formView = document.getElementById("form-view");
  const successMessage = document.getElementById("success-message");
  const successHeading = document.getElementById("success-heading");
  const submitButton = document.getElementById("submit-button");
  const submitLabel = document.getElementById("submit-label");
  const formStatus = document.getElementById("form-status");

  const strength = document.getElementById("password-strength");
  const strengthLabel = document.getElementById("password-strength-label");
  const strengthLive = document.getElementById("strength-live");

  const operatorName = document.getElementById("operator-name");
  const operatorStatus = document.getElementById("operator-status");

  const inputs = {
    callsign: document.getElementById("callsign"),
    email: document.getElementById("email"),
    password: document.getElementById("password"),
    confirm: document.getElementById("confirm-password"),
    terms: document.getElementById("terms"),
  };

  const CALLSIGN_PATTERN = /^[A-Za-z0-9_-]{3,20}$/;
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /* ----------------------------------------------------------------------
     Field definitions
     ---------------------------------------------------------------------- */

  const fields = {
    callsign: {
      input: inputs.callsign,
      group: inputs.callsign.closest(".form-group"),
      error: document.getElementById("callsign-error"),
      checked: false,
      validate(value) {
        const clean = value.trim();

        if (!clean) {
          return { valid: false, message: "Enter your callsign." };
        }

        if (!CALLSIGN_PATTERN.test(clean)) {
          return {
            valid: false,
            message: "Use 3–20 characters: letters, numbers, _ or -.",
          };
        }

        return { valid: true, message: "" };
      },
    },

    email: {
      input: inputs.email,
      group: inputs.email.closest(".form-group"),
      error: document.getElementById("email-error"),
      checked: false,
      validate(value) {
        const clean = value.trim();

        if (!clean) {
          return { valid: false, message: "Enter your email." };
        }

        if (!EMAIL_PATTERN.test(clean)) {
          return { valid: false, message: "Enter a valid email address." };
        }

        return { valid: true, message: "" };
      },
    },

    password: {
      input: inputs.password,
      group: inputs.password.closest(".form-group"),
      error: document.getElementById("password-error"),
      checked: false,
      validate(value) {
        if (!value) {
          return { valid: false, message: "Enter a password." };
        }

        if (value.length < 8) {
          return {
            valid: false,
            message: "Password must be at least 8 characters.",
          };
        }

        return { valid: true, message: "" };
      },
    },

    confirm: {
      input: inputs.confirm,
      group: inputs.confirm.closest(".form-group"),
      error: document.getElementById("confirm-password-error"),
      checked: false,
      validate(value) {
        if (!value) {
          return { valid: false, message: "Confirm your password." };
        }

        if (value !== inputs.password.value) {
          return { valid: false, message: "Passwords do not match." };
        }

        return { valid: true, message: "" };
      },
    },
  };

  const fieldList = Object.values(fields);

  fieldList.forEach((field) => {
    field.errorText = field.error.querySelector("span");
  });

  const termsGroup = inputs.terms.closest(".form-group");
  const termsError = document.getElementById("terms-error");
  const termsErrorText = termsError.querySelector("span");

  /* ----------------------------------------------------------------------
     Field rendering
     ---------------------------------------------------------------------- */

  function showFieldError(field, message) {
    field.errorText.textContent = message;
    field.error.hidden = false;
    field.group.classList.add("has-error");
    field.group.classList.remove("is-valid");
    field.input.setAttribute("aria-invalid", "true");
  }

  function showFieldValid(field) {
    field.errorText.textContent = "";
    field.error.hidden = true;
    field.group.classList.remove("has-error");
    field.group.classList.add("is-valid");
    field.input.removeAttribute("aria-invalid");
  }

  function resetField(field) {
    field.errorText.textContent = "";
    field.error.hidden = true;
    field.group.classList.remove("has-error", "is-valid");
    field.input.removeAttribute("aria-invalid");
  }

  function validateField(field) {
    const result = field.validate(field.input.value);

    if (result.valid) {
      showFieldValid(field);
    } else {
      showFieldError(field, result.message);
    }

    return result.valid;
  }

  function showTermsError() {
    termsErrorText.textContent = "You must accept the terms to continue.";
    termsError.hidden = false;
    termsGroup.classList.add("has-error");
    inputs.terms.setAttribute("aria-invalid", "true");
  }

  function clearTermsError() {
    termsErrorText.textContent = "";
    termsError.hidden = true;
    termsGroup.classList.remove("has-error");
    inputs.terms.removeAttribute("aria-invalid");
  }

  /* ----------------------------------------------------------------------
     Password strength
     ---------------------------------------------------------------------- */

  const STRENGTH_LEVELS = ["", "weak", "fair", "good", "strong"];
  const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"];
  let lastStrengthAnnouncement = "";

  function getStrengthScore(value) {
    if (!value) {
      return 0;
    }

    if (value.length < 8) {
      return 1;
    }

    let score = 1;

    if (value.length >= 12) {
      score += 1;
    }

    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) {
      score += 1;
    }

    if (/\d/.test(value)) {
      score += 1;
    }

    if (/[^A-Za-z0-9\s]/.test(value)) {
      score += 1;
    }

    return Math.min(score, 4);
  }

  function updateStrength() {
    const score = getStrengthScore(inputs.password.value);

    strength.dataset.level = STRENGTH_LEVELS[score];
    strengthLabel.textContent = STRENGTH_LABELS[score];

    const announcement = score
      ? `Password strength: ${STRENGTH_LABELS[score]}`
      : "";

    if (announcement !== lastStrengthAnnouncement) {
      strengthLive.textContent = announcement;
      lastStrengthAnnouncement = announcement;
    }
  }

  /* ----------------------------------------------------------------------
     Operator ID readout
     ---------------------------------------------------------------------- */

  const checkElements = {
    callsign: document.querySelector('[data-check="callsign"]'),
    email: document.querySelector('[data-check="email"]'),
    password: document.querySelector('[data-check="password"]'),
    confirm: document.querySelector('[data-check="confirm"]'),
    terms: document.querySelector('[data-check="terms"]'),
  };

  function setCheck(key, isValid) {
    checkElements[key].classList.toggle("is-valid", isValid);
    checkElements[key].querySelector(".check-state").textContent = isValid
      ? "Linked"
      : "Pending";
  }

  function updateOperator() {
    const cleanCallsign = inputs.callsign.value.trim();

    operatorName.textContent = cleanCallsign || "Unassigned";
    operatorName.classList.toggle("is-empty", !cleanCallsign);

    const states = {
      callsign: fields.callsign.validate(inputs.callsign.value).valid,
      email: fields.email.validate(inputs.email.value).valid,
      password: fields.password.validate(inputs.password.value).valid,
      confirm: fields.confirm.validate(inputs.confirm.value).valid,
      terms: inputs.terms.checked,
    };

    Object.entries(states).forEach(([key, isValid]) => {
      setCheck(key, isValid);
    });

    const isReady = Object.values(states).every(Boolean);

    operatorStatus.textContent = isReady ? "Ready" : "Standby";
    operatorStatus.classList.toggle("is-ready", isReady);
  }

  /* ----------------------------------------------------------------------
     Live validation
     ---------------------------------------------------------------------- */

  fieldList.forEach((field) => {
    field.input.addEventListener("blur", () => {
      const hasValue =
        field.input === inputs.callsign
          ? field.input.value.trim() !== ""
          : field.input.value !== "";

      if (!hasValue && !field.checked) {
        resetField(field);
      } else {
        if (hasValue) {
          field.checked = true;
        }

        validateField(field);
      }

      updateOperator();
    });

    field.input.addEventListener("input", () => {
      if (field.input === inputs.password) {
        updateStrength();

        if (fields.confirm.checked) {
          validateField(fields.confirm);
        }
      }

      if (field.checked) {
        validateField(field);
      }

      updateOperator();
    });
  });

  inputs.terms.addEventListener("change", () => {
    clearTermsError();
    updateOperator();
  });

  /* ----------------------------------------------------------------------
     Show / hide passwords
     ---------------------------------------------------------------------- */

  const toggles = Array.from(document.querySelectorAll(".toggle-password"));

  function setPasswordVisibility(button, isVisible) {
    const input = document.getElementById(button.dataset.target);

    if (!input) {
      return;
    }

    input.type = isVisible ? "text" : "password";
    button.setAttribute("aria-pressed", String(isVisible));
    button.setAttribute("aria-label", isVisible ? "Hide password" : "Show password");
    button.querySelector("img").src = isVisible
      ? "./assets/images/icon-eye-off.svg"
      : "./assets/images/icon-eye.svg";
  }

  toggles.forEach((button) => {
    button.addEventListener("click", () => {
      const isVisible = button.getAttribute("aria-pressed") === "true";
      setPasswordVisibility(button, !isVisible);
    });
  });

  /* ----------------------------------------------------------------------
     Caps Lock warning
     ---------------------------------------------------------------------- */

  function watchCapsLock(input, warning) {
    if (!input || !warning) {
      return;
    }

    const update = (event) => {
      const capsOn =
        typeof event.getModifierState === "function" &&
        event.getModifierState("CapsLock");

      warning.hidden = !capsOn;
    };

    input.addEventListener("keydown", update);
    input.addEventListener("keyup", update);
    input.addEventListener("blur", () => {
      warning.hidden = true;
    });
  }

  watchCapsLock(inputs.password, document.getElementById("password-caps-warning"));
  watchCapsLock(inputs.confirm, document.getElementById("confirm-caps-warning"));

  /* ----------------------------------------------------------------------
     Submit
     ---------------------------------------------------------------------- */

  let isSubmitting = false;
  let announceTimer = null;

  function announce(message) {
    if (announceTimer) {
      window.clearTimeout(announceTimer);
    }

    formStatus.textContent = "";

    announceTimer = window.setTimeout(() => {
      formStatus.textContent = message;
      announceTimer = null;
    }, 60);
  }

  function submitForm() {
    isSubmitting = true;

    // Never leave a revealed password on screen while submitting.
    toggles.forEach((button) => setPasswordVisibility(button, false));

    // Lock the fields but keep the submit button focusable so keyboard and
    // screen reader users do not lose focus while the form is busy.
    Array.from(form.elements).forEach((element) => {
      if (element !== submitButton) {
        element.disabled = true;
      }
    });

    submitButton.classList.add("is-loading");
    submitButton.setAttribute("aria-disabled", "true");
    submitButton.setAttribute("aria-busy", "true");
    submitLabel.textContent = "Transmitting";

    announce("Submitting form");

    window.setTimeout(() => {
      formView.hidden = true;
      successMessage.hidden = false;

      if (announceTimer) {
        window.clearTimeout(announceTimer);
        announceTimer = null;
      }

      formStatus.textContent = "";
      successHeading.focus();
    }, 1400);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    let invalidCount = 0;
    let firstInvalid = null;

    fieldList.forEach((field) => {
      field.checked = true;

      if (!validateField(field)) {
        invalidCount += 1;

        if (!firstInvalid) {
          firstInvalid = field.input;
        }
      }
    });

    if (!inputs.terms.checked) {
      showTermsError();
      invalidCount += 1;

      if (!firstInvalid) {
        firstInvalid = inputs.terms;
      }
    } else {
      clearTermsError();
    }

    updateOperator();

    if (invalidCount > 0) {
      announce(
        invalidCount === 1
          ? "1 field needs attention"
          : `${invalidCount} fields need attention`
      );

      if (firstInvalid) {
        firstInvalid.focus();
      }

      return;
    }

    submitForm();
  });

  /* ----------------------------------------------------------------------
     Initial state
     ---------------------------------------------------------------------- */

  updateStrength();
  updateOperator();
})();
