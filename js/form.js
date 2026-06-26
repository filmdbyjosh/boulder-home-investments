(function () {
  'use strict';

  const form = document.getElementById('buyer-form');
  const steps = [...document.querySelectorAll('.step')];
  const btnBack = document.getElementById('btn-back');
  const btnNext = document.getElementById('btn-next');
  const btnSubmit = document.getElementById('btn-submit');
  const formStatus = document.getElementById('form-status');
  const stepLabel = document.getElementById('step-label');
  const progressFill = document.getElementById('progress-fill');
  const progressBar = document.getElementById('progress-bar');
  const wizardTop = document.getElementById('wizard-top');
  const yearEl = document.getElementById('year');

  const TOTAL = steps.length;
  const QUESTION_COUNT = TOTAL - 1;
  let current = 1;

  if (yearEl) yearEl.textContent = new Date().getFullYear();
  if (!form || !steps.length) return;

  const checkboxGroups = ['property_types', 'conditions', 'contact_preference'];

  const PRICE_MIN = 50000;
  const PRICE_MAX = 10000000;
  const PRICE_STEP = 50000;

  function parsePrice(value) {
    return Number(String(value).replace(/[^\d]/g, '')) || 0;
  }

  function formatPrice(value) {
    const n = typeof value === 'number' ? value : parsePrice(value);
    if (!n) return '';
    return n.toLocaleString('en-US');
  }

  function snapPrice(value) {
    let n = parsePrice(value);
    if (!n) return 0;
    n = Math.round(n / PRICE_STEP) * PRICE_STEP;
    return Math.max(PRICE_MIN, Math.min(PRICE_MAX, n));
  }

  function initPriceInputs() {
    form.querySelectorAll('.price-input').forEach((el) => {
      el.addEventListener('input', () => {
        const digits = el.value.replace(/[^\d]/g, '');
        el.value = digits ? formatPrice(digits) : '';
        clearStepError('price_range');
        el.classList.remove('error');
      });

      el.addEventListener('blur', () => {
        if (!el.value.trim()) return;
        const snapped = snapPrice(el.value);
        el.value = snapped ? formatPrice(snapped) : '';
      });
    });
  }

  const anyOption = form.querySelector('[data-any-option]');
  const propertyCheckboxes = form.querySelectorAll('input[name="property_types"]');

  if (anyOption) {
    anyOption.addEventListener('change', () => {
      if (anyOption.checked) {
        propertyCheckboxes.forEach((cb) => {
          if (cb !== anyOption) cb.checked = false;
        });
      }
    });
    propertyCheckboxes.forEach((cb) => {
      if (cb === anyOption) return;
      cb.addEventListener('change', () => {
        if (cb.checked) anyOption.checked = false;
      });
    });
  }

  function getCheckedValues(name) {
    return [...form.querySelectorAll(`input[name="${name}"]:checked`)].map((el) => el.value);
  }

  function showStepError(key, message) {
    const el = form.querySelector(`[data-error-for="${key}"]`);
    if (el) {
      el.textContent = message;
      el.hidden = false;
    }
  }

  function clearStepError(key) {
    const el = form.querySelector(`[data-error-for="${key}"]`);
    if (el) el.hidden = true;
  }

  function hideStatus() {
    if (formStatus) formStatus.hidden = true;
  }

  function showStatus(message) {
    if (!formStatus) return;
    formStatus.textContent = message;
    formStatus.hidden = false;
  }

  function validateZip(zip) {
    return /^\d{5}$/.test(zip);
  }

  function validateStep(step) {
    hideStatus();

    if (step === 1) return true;

    if (step === 2) {
      clearStepError('property_types');
      if (getCheckedValues('property_types').length === 0) {
        showStepError('property_types', 'Select at least one property type.');
        return false;
      }
    }

    if (step === 3) {
      clearStepError('location');
      const city = form.querySelector('#city');
      const zip = form.querySelector('#zip');
      city.classList.remove('error');
      zip.classList.remove('error');

      if (!city.value.trim() || !zip.value.trim()) {
        if (!city.value.trim()) city.classList.add('error');
        if (!zip.value.trim()) zip.classList.add('error');
        showStepError('location', 'Enter both city and zip code.');
        return false;
      }
      if (!validateZip(zip.value.trim())) {
        zip.classList.add('error');
        showStepError('location', 'Enter a valid 5-digit zip code.');
        return false;
      }
    }

    if (step === 4) {
      clearStepError('price_range');
      const minEl = form.querySelector('#min_price');
      const maxEl = form.querySelector('#max_price');
      minEl.classList.remove('error');
      maxEl.classList.remove('error');

      const min = snapPrice(minEl.value);
      const max = snapPrice(maxEl.value);

      if (!min || !max) {
        if (!min) minEl.classList.add('error');
        if (!max) maxEl.classList.add('error');
        showStepError('price_range', 'Enter both minimum and maximum price.');
        return false;
      }

      minEl.value = formatPrice(min);
      maxEl.value = formatPrice(max);

      if (min > max) {
        minEl.classList.add('error');
        maxEl.classList.add('error');
        showStepError('price_range', 'Minimum cannot be greater than maximum.');
        return false;
      }
    }

    if (step === 5) {
      clearStepError('conditions');
      if (getCheckedValues('conditions').length === 0) {
        showStepError('conditions', 'Select at least one condition.');
        return false;
      }
    }

    if (step === 6) {
      clearStepError('contact_preference');
      if (getCheckedValues('contact_preference').length === 0) {
        showStepError('contact_preference', 'Select at least one option.');
        return false;
      }
    }

    if (step === 7) {
      clearStepError('contact');
      const fields = ['#name', '#email', '#phone'];
      let empty = false;
      fields.forEach((sel) => {
        const el = form.querySelector(sel);
        el.classList.remove('error');
        if (!el.value.trim()) {
          el.classList.add('error');
          empty = true;
        }
      });
      if (empty) {
        showStepError('contact', 'All contact fields are required.');
        return false;
      }
    }

    return true;
  }

  function updateUI() {
    const isWelcome = current === 1;
    const questionNum = current - 1;

    steps.forEach((step) => {
      const n = Number(step.dataset.step);
      step.classList.remove('is-active', 'is-exit');
      if (n === current) step.classList.add('is-active');
      else if (n < current) step.classList.add('is-exit');
    });

    if (wizardTop) wizardTop.hidden = isWelcome;

    if (!isWelcome) {
      stepLabel.textContent = `Step ${questionNum} of ${QUESTION_COUNT}`;
      progressFill.style.width = `${(questionNum / QUESTION_COUNT) * 100}%`;
      progressBar.setAttribute('aria-valuenow', String(questionNum));
      progressBar.setAttribute('aria-valuemax', String(QUESTION_COUNT));
    }

    btnBack.hidden = current === 1;
    btnNext.hidden = current === TOTAL;
    btnSubmit.hidden = current !== TOTAL;

    if (isWelcome) {
      btnNext.textContent = 'Continue';
    } else if (current === TOTAL) {
      btnNext.textContent = 'Continue';
    } else {
      btnNext.textContent = 'Continue';
    }
  }

  function goTo(step) {
    if (step < 1 || step > TOTAL) return;
    current = step;
    updateUI();
  }

  btnNext.addEventListener('click', () => {
    if (!validateStep(current)) return;
    goTo(current + 1);
  });

  btnBack.addEventListener('click', () => {
    hideStatus();
    goTo(current - 1);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideStatus();

    if (!validateStep(current)) return;

    const formId = window.FORMSPREE_FORM_ID;
    if (!formId) {
      showStatus('Form is not connected yet. Please try again later.');
      return;
    }

    const payload = {
      property_types: getCheckedValues('property_types').join(', '),
      city: form.querySelector('#city').value.trim(),
      zip: form.querySelector('#zip').value.trim(),
      min_price: formatPrice(parsePrice(form.querySelector('#min_price').value)),
      max_price: formatPrice(parsePrice(form.querySelector('#max_price').value)),
      conditions: getCheckedValues('conditions').join(', '),
      contact_preference: getCheckedValues('contact_preference').join(', '),
      name: form.querySelector('#name').value.trim(),
      email: form.querySelector('#email').value.trim(),
      phone: form.querySelector('#phone').value.trim(),
      _replyto: form.querySelector('#email').value.trim(),
      _subject: 'New Buyer Intake — Boulder Home Investments',
    };

    const defaultLabel = btnSubmit.textContent;
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Sending…';

    try {
      const response = await fetch(`https://formspree.io/f/${formId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Submit failed');
      window.location.href = 'thank-you.html';
    } catch (err) {
      showStatus('Something went wrong. Please try again.');
      btnSubmit.disabled = false;
      btnSubmit.textContent = defaultLabel;
    }
  });

  checkboxGroups.forEach((name) => {
    form.querySelectorAll(`input[name="${name}"]`).forEach((cb) => {
      cb.addEventListener('change', () => clearStepError(name));
    });
  });

  form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="number"]').forEach((input) => {
    input.addEventListener('input', () => {
      input.classList.remove('error');
      const step = input.closest('.step');
      if (step) {
        const err = step.querySelector('.step__error');
        if (err) err.hidden = true;
      }
    });
  });

  initPriceInputs();
  updateUI();
})();
