import { css } from 'lit'

export const pageStyles = css`
  :host {
    width: 100%;
  }

  .header {
    font-size: 12px;
    font-weight: 400;
    margin: 15px 0px;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    width: 100%;
    text-align: center;
  }

  .content {
    width: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    margin-bottom: 0;
    position: relative;
    min-height: 100px;
    /* Ensure we can't see the mask when fully scrolled to the bottom */
    padding-bottom: 10px;
    mask-image: linear-gradient(0deg, transparent 0px, black 10px);

    /* Given .content has overflow: scroll, I feel we shouldn't need
     * a max-height to constrain the content, but it just doesn't work
     * So we set it manually to be correct. */
    max-height: min(calc(100vh - 270px), 360px);
  }
`
