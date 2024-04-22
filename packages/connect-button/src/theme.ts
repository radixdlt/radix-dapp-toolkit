import { css } from 'lit'

export const variablesCSS = css`
  :host {
    /* Core colors */
    --color-radix-green-1: #00ab84;
    --color-radix-green-2: #00c389;
    --color-radix-green-3: #21ffbe;
    --color-radix-blue-1: #060f8f;
    --color-radix-blue-2: #052cc0;
    --color-radix-blue-3: #20e4ff;
    --color-light: #ffffff;
    --color-dark: #000000;

    /* Accent colors */
    --color-accent-red: #ef4136;
    --color-accent-blue: #00aeef;
    --color-accent-yellow: #fff200;
    --color-alert: #e59700;
    --color-radix-error-red-1: #c82020;
    --color-radix-error-red-2: #fcebeb;

    /* Neutral colors */
    --color-grey-1: #003057;
    --color-grey-2: #8a8fa4;
    --color-grey-3: #ced0d6;
    --color-grey-4: #e2e5ed;
    --color-grey-5: #f4f5f9;
  }
`

export const themeCSS = css`
  :host {
    font-family:
      'IBM Plex Sans',
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      'Segoe UI',
      Roboto,
      Oxygen,
      Ubuntu,
      Cantarell,
      'Open Sans',
      'Helvetica Neue',
      sans-serif;
  }

  :host([mode='light']) {
    --radix-popover-background: color-mix(in srgb, #efefef 50%, transparent);
    --radix-popover-text-color: var(--color-grey-1);

    --radix-popover-tabs-background: color-mix(
      in srgb,
      var(--color-grey-2) 15%,
      transparent
    );
    --radix-popover-tabs-button-active-background: var(--color-light);

    --radix-link-color: var(--color-radix-blue-2);

    --radix-card-background: var(--color-light);
    --radix-card-text-color: var(--color-grey-1);
    --radix-card-text-dimmed-color: var(--color-grey-2);
    --radix-card-inverted-background: var(--color-grey-1);
    --radix-card-inverted-text-color: var(--color-light);

    --radix-avatar-border-color: var(--color-grey-5);
    --radix-mask-background: color-mix(
      in srgb,
      var(--color-light) 50%,
      transparent
    );

    --radix-button-background: color-mix(
      in srgb,
      var(--color-light) 80%,
      transparent
    );
    --radix-button-background-hover: var(--color-light);
    --radix-button-background-pressed: var(--color-grey-5);
    --radix-button-text-color: var(--color-radix-blue-2);

    --radix-button-disabled-background: color-mix(
      in srgb,
      var(--color-light) 80%,
      transparent
    );
    --radix-button-disabled-text-color: var(--color-grey-3);

    color: var(--color-grey-1);
  }

  :host([mode='dark']) {
    --radix-popover-background: color-mix(in srgb, #000000 50%, transparent);
    --radix-popover-text-color: var(--color-light);

    --radix-popover-tabs-background: color-mix(
      in srgb,
      var(--color-dark) 60%,
      transparent
    );
    --radix-popover-tabs-button-active-text-color: var(--color-light);
    --radix-popover-tabs-button-active-background: #515151;

    --radix-link-color: var(--color-white);

    --radix-card-background: #515151;
    --radix-card-text-color: var(--color-light);
    --radix-card-text-dimmed-color: var(--color-grey-3);
    --radix-card-inverted-background: var(--color-grey-5);
    --radix-card-inverted-text-color: var(--color-grey-1);

    --radix-avatar-border-color: #656565;
    --radix-mask-background: color-mix(
      in srgb,
      var(--color-dark) 40%,
      transparent
    );

    --radix-button-background: color-mix(
      in srgb,
      var(--color-dark) 40%,
      transparent
    );
    --radix-button-background-hover: var(--color-dark);
    --radix-button-background-pressed: #414141;
    --radix-button-text-color: var(--color-light);

    --radix-button-disabled-background: color-mix(
      in srgb,
      var(--color-dark) 40%,
      transparent
    );
    --radix-button-disabled-text-color: color-mix(
      in srgb,
      var(--color-light) 20%,
      transparent
    );

    color: var(--color-light);
  }

  :host([theme='radix-blue']) {
    --radix-connect-button-background: var(--color-radix-blue-2);
    --radix-connect-button-background-hover: var(--color-radix-blue-1);
    --radix-connect-button-border-color: var(--color-radix-blue-2);
    --radix-connect-button-text-color: var(--color-light);
  }

  :host([theme='black']) {
    --radix-connect-button-background: var(--color-dark);
    --radix-connect-button-background-hover: #3e3e3e;
    --radix-connect-button-border-color: var(--color-dark);
    --radix-connect-button-text-color: var(--color-light);
  }

  :host([theme='white-with-outline']) {
    --radix-connect-button-background: var(--color-light);
    --radix-connect-button-background-hover: var(--color-grey-5);
    --radix-connect-button-border-color: var(--color-dark);
    --radix-connect-button-text-color: var(--color-dark);
  }

  :host([theme='white']) {
    --radix-connect-button-background: var(--color-light);
    --radix-connect-button-background-hover: var(--color-grey-5);
    --radix-connect-button-border-color: var(--color-light);
    --radix-connect-button-text-color: var(--color-dark);
  }
`
