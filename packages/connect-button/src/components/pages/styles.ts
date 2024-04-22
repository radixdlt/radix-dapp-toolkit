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
    overflow: auto;
    width: 100%;
    margin-bottom: 0;
    position: relative;
    -webkit-mask-image: linear-gradient(180deg, black 90%, transparent 100%);
    mask-image: linear-gradient(180deg, black 90%, transparent 95%);
  }
`
