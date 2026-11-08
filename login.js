(() => {
  "use strict";

  /* ----------------------------------------------------------------------
     Elements
     ---------------------------------------------------------------------- */

  const form = document.getElementById("login-form");
  const formView = document.getElementById("form-view");
  const successMessage = document.getElementById("success-message");
  const successHeading = document.getElementById("success-heading");
  const submitButton = document.getElementById("login-button");
  const submitLabel = document.getElementById("login-label");
  const formStatus = document.getElementById("form-status");

  const sessionName = document.getElementById("session-name");
  const sessionStatus = document.getElementById("session-status");

  const identifier = document.getElementById("identifier");
  const password = document.getElementById("login-password");

  const CALLSIGN_PATTERN = /^[A-Za-z0-9_-]{3,20}$/;
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /* ----------------------------------------------------------------------
     Field definitions
     ---------------------------------------------------------------------- */

  const fields = {
    identifier: {
      input: identifier,
      group: identifier.closest(".form-group"),
      error: document.getElementById("identifier-error"),
      checked: false,
      validate(value) {
        const clean = value.trim();

        if (!clean) {
          return { valid: false, message: "Enter your callsign or email." };
        }

        if (clean.includes("@")) {
          if (!EMAIL_PATTERN.test(clean)) {
            return { valid: false, message: "Enter a valid email address." };
          }

          return { valid: true, message: "" };
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

    password: {
      input: password,
      group: password.closest(".form-group"),
      error: document.getElementById("login-password-error"),
      checked: false,
      validate(value) {
        if (!value) {
          return { valid: false, message: "Enter your password." };
        }

        return { valid: true, message: "" };
      },
    },
  };

  const fieldList = Object.values(fields);

  fieldList.forEach((field) => {
    field.errorText = field.error.querySelector("span");
  });

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

  /* ----------------------------------------------------------------------
     Session readout
     ---------------------------------------------------------------------- */

  const checkElements = {
    identifier: document.querySelector('[data-check="identifier"]'),
    password: document.querySelector('[data-check="password"]'),
    session: document.querySelector('[data-check="session"]'),
  };

  let sessionActive = false;

  function setCheck(key, isValid) {
    checkElements[key].classList.toggle("is-valid", isValid);
    checkElements[key].querySelector(".check-state").textContent = isValid
      ? "Linked"
      : "Pending";
  }

  function updateSession() {
    const cleanIdentifier = identifier.value.trim();
    const identityValid = fields.identifier.validate(identifier.value).valid;
    const credentialsValid = fields.password.validate(password.value).valid;

    sessionName.textContent = cleanIdentifier || "Guest";
    sessionName.classList.toggle("is-empty", !cleanIdentifier);

    setCheck("identifier", identityValid);
    setCheck("password", credentialsValid);
    setCheck("session", sessionActive);

    const isReady = identityValid && credentialsValid;

    sessionStatus.textContent = sessionActive
      ? "Online"
      : isReady
        ? "Ready"
        : "Standby";
    sessionStatus.classList.toggle("is-ready", sessionActive || isReady);
  }

  /* ----------------------------------------------------------------------
     Live validation
     ---------------------------------------------------------------------- */

  fieldList.forEach((field) => {
    field.input.addEventListener("blur", () => {
      const hasValue = field.input.value !== "";

      if (!hasValue && !field.checked) {
        resetField(field);
      } else {
        if (hasValue) {
          field.checked = true;
        }

        validateField(field);
      }

      updateSession();
    });

    field.input.addEventListener("input", () => {
      if (field.checked) {
        validateField(field);
      }

      updateSession();
    });
  });

  /* ----------------------------------------------------------------------
     Show / hide password
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

  const passwordCapsWarning = document.getElementById("login-password-caps-warning");

  function updateCapsLock(event) {
    const capsOn =
      typeof event.getModifierState === "function" &&
      event.getModifierState("CapsLock");

    passwordCapsWarning.hidden = !capsOn;
  }

  password.addEventListener("keydown", updateCapsLock);
  password.addEventListener("keyup", updateCapsLock);
  password.addEventListener("blur", () => {
    passwordCapsWarning.hidden = true;
  });

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

    toggles.forEach((button) => setPasswordVisibility(button, false));

    Array.from(form.elements).forEach((element) => {
      if (element !== submitButton) {
        element.disabled = true;
      }
    });

    submitButton.classList.add("is-loading");
    submitButton.setAttribute("aria-disabled", "true");
    submitButton.setAttribute("aria-busy", "true");
    submitLabel.textContent = "Authenticating";

    announce("Authenticating");

    window.setTimeout(() => {
      sessionActive = true;
      updateSession();

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

    updateSession();

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

  updateSession();
})();
