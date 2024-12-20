import { StoryObj, Meta } from '@storybook/web-components'
import { html } from 'lit-html'

export default {
  title: 'Radix/Header with blur',
} as Meta

export const Example: StoryObj = {
  render: () => html`
    <style>
      .sb-main-padded {
        padding: 0 !important;
      }
      header {
        backdrop-filter: blur(5px);
        position: fixed;
        width: 100%;
        background: rgba(0, 0, 0, 0.1);
        text-align: center;
        padding: 20px 0;
      }
    </style>
    <header>
      <radix-connect-button></radix-connect-button>
    </header>
    <main>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent sit amet
      ante bibendum mauris porttitor vehicula non varius quam. Integer aliquam
      nibh in condimentum eleifend. Ut quis suscipit dui. Quisque vitae varius
      nisi, porttitor dapibus mauris. Integer porta turpis in egestas
      vestibulum. Aliquam pellentesque massa neque, et interdum augue facilisis
      nec. Suspendisse accumsan non sem vel ultrices. Integer sodales tincidunt
      ex sed mollis. Proin sit amet magna ut ipsum efficitur placerat. Quisque
      justo purus, lacinia efficitur lacus nec, ornare vulputate purus.
      Suspendisse vel aliquet mauris. Aliquam auctor ipsum nisl, in commodo
      velit aliquet vitae. Aliquam sodales, leo ut laoreet porta, justo lectus
      facilisis orci, vel efficitur nisl leo quis tortor. Donec vitae fermentum
      mi. Fusce congue tincidunt sagittis. Nunc posuere posuere mauris at
      lacinia. Pellentesque quam magna, pulvinar eget vestibulum eget, luctus a
      felis. Nulla facilisi. Orci varius natoque penatibus et magnis dis
      parturient montes, nascetur ridiculus mus. Curabitur auctor egestas
      auctor. Orci varius natoque penatibus et magnis dis parturient montes,
      nascetur ridiculus mus. Donec eu interdum diam. Ut mattis diam id risus
      molestie viverra. Praesent vehicula massa eu turpis rutrum bibendum. In
      euismod vulputate mi. Duis non tempus eros. Quisque ut efficitur dui.
      Maecenas molestie auctor tincidunt. Sed finibus eu lacus commodo dapibus.
      Aliquam tincidunt mauris nibh, eget laoreet orci lacinia nec. Duis tempor
      neque sed orci maximus, at rhoncus mi tempus. Mauris ante arcu, dapibus at
      tellus non, accumsan facilisis nunc. Nullam ac convallis ex. Nam vitae
      diam volutpat, fermentum augue sed, fermentum mi. Mauris vestibulum
      accumsan turpis, ac tempor mauris hendrerit ut. Quisque hendrerit feugiat
      enim sit amet blandit. Sed efficitur ultrices quam viverra accumsan. Donec
      vehicula hendrerit purus at laoreet. Cras et ultrices justo, sed hendrerit
      tellus. Ut efficitur dolor nec magna tincidunt mollis eu eget nibh.
    </main>
  `,
}

export const Example2: StoryObj = {
  render: () => html`
    <style>
      .sb-main-padded {
        padding: 0 !important;
      }
      header {
        position: fixed;
        width: 100%;
      }
      .blur-header {
        backdrop-filter: blur(5px);
        width: 100%;
        height: 100%;
        position: absolute;
        background: rgba(0, 0, 0, 0.1);
      }
      .actual-header {
        text-align: center;
        padding: 20px 0;
      }
    </style>
    <header>
      <div class="blur-header"></div>
      <div class="actual-header">
        <radix-connect-button></radix-connect-button>
      </div>
    </header>
    <main>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent sit amet
      ante bibendum mauris porttitor vehicula non varius quam. Integer aliquam
      nibh in condimentum eleifend. Ut quis suscipit dui. Quisque vitae varius
      nisi, porttitor dapibus mauris. Integer porta turpis in egestas
      vestibulum. Aliquam pellentesque massa neque, et interdum augue facilisis
      nec. Suspendisse accumsan non sem vel ultrices. Integer sodales tincidunt
      ex sed mollis. Proin sit amet magna ut ipsum efficitur placerat. Quisque
      justo purus, lacinia efficitur lacus nec, ornare vulputate purus.
      Suspendisse vel aliquet mauris. Aliquam auctor ipsum nisl, in commodo
      velit aliquet vitae. Aliquam sodales, leo ut laoreet porta, justo lectus
      facilisis orci, vel efficitur nisl leo quis tortor. Donec vitae fermentum
      mi. Fusce congue tincidunt sagittis. Nunc posuere posuere mauris at
      lacinia. Pellentesque quam magna, pulvinar eget vestibulum eget, luctus a
      felis. Nulla facilisi. Orci varius natoque penatibus et magnis dis
      parturient montes, nascetur ridiculus mus. Curabitur auctor egestas
      auctor. Orci varius natoque penatibus et magnis dis parturient montes,
      nascetur ridiculus mus. Donec eu interdum diam. Ut mattis diam id risus
      molestie viverra. Praesent vehicula massa eu turpis rutrum bibendum. In
      euismod vulputate mi. Duis non tempus eros. Quisque ut efficitur dui.
      Maecenas molestie auctor tincidunt. Sed finibus eu lacus commodo dapibus.
      Aliquam tincidunt mauris nibh, eget laoreet orci lacinia nec. Duis tempor
      neque sed orci maximus, at rhoncus mi tempus. Mauris ante arcu, dapibus at
      tellus non, accumsan facilisis nunc. Nullam ac convallis ex. Nam vitae
      diam volutpat, fermentum augue sed, fermentum mi. Mauris vestibulum
      accumsan turpis, ac tempor mauris hendrerit ut. Quisque hendrerit feugiat
      enim sit amet blandit. Sed efficitur ultrices quam viverra accumsan. Donec
      vehicula hendrerit purus at laoreet. Cras et ultrices justo, sed hendrerit
      tellus. Ut efficitur dolor nec magna tincidunt mollis eu eget nibh.
    </main>
  `,
}
