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
      tellus. Ut efficitur dolor nec magna tincidunt mollis eu eget nibh. Mauris
      sit amet interdum mauris, quis fringilla ex. Duis augue enim, gravida ac
      lectus fermentum, semper egestas magna. Sed at metus non magna tempus
      suscipit nec et massa. Pellentesque ut sem ut nunc gravida vehicula sit
      amet at felis. Suspendisse suscipit pulvinar ipsum, non eleifend velit
      ultrices eu. Maecenas vitae semper quam. Suspendisse molestie pulvinar
      lorem eu iaculis. Sed ut ligula nisl. Pellentesque habitant morbi
      tristique senectus et netus et malesuada fames ac turpis egestas. Vivamus
      in rhoncus sem. Etiam dignissim ex non efficitur ultricies. Vestibulum
      ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia
      curae; In finibus, orci et feugiat maximus, sem massa finibus nisi, ut
      viverra risus lacus vel est. Vestibulum semper blandit aliquam. Sed a orci
      dolor. Vivamus consequat eros urna, vel volutpat erat egestas quis.
      Integer accumsan lorem sit amet tristique maximus. Aenean pharetra commodo
      dolor. Suspendisse dapibus nibh eget volutpat tempus. Interdum et
      malesuada fames ac ante ipsum primis in faucibus. In feugiat scelerisque
      risus pharetra vestibulum. Praesent suscipit eget velit id laoreet. Morbi
      quis arcu gravida augue placerat pharetra vitae id dui. Nunc congue tempus
      eleifend. Ut sed vulputate sem. Vivamus dignissim est ut turpis consequat
      dignissim. Aenean eget facilisis dui, vitae rutrum eros. Nullam dignissim
      non ipsum a aliquet. Etiam dolor augue, sodales ac magna in, sagittis
      tempus leo. Maecenas eu sapien bibendum, consectetur nibh quis, ornare
      felis. Quisque ornare luctus lacus sed condimentum. Praesent lorem ex,
      efficitur sed orci eget, tincidunt egestas mi. Vivamus blandit sapien sit
      amet nunc consectetur feugiat. Cras tempor sagittis est, vitae mollis
      libero auctor at. Integer eget enim mollis, elementum arcu a, maximus
      diam. Interdum et malesuada fames ac ante ipsum primis in faucibus. Donec
      mi lectus, suscipit non dolor commodo, tempor blandit nunc. Interdum et
      malesuada fames ac ante ipsum primis in faucibus. Nulla pellentesque
      elementum risus scelerisque posuere. Nullam gravida lectus eget eros
      molestie bibendum. Suspendisse at elit porttitor, commodo tellus et,
      pharetra nisl. Ut fringilla, massa vel sagittis consectetur, tortor purus
      ornare risus, in molestie sem nibh in eros. Phasellus ac odio vel tellus
      posuere volutpat eu vitae augue. Maecenas finibus ultricies odio, sed
      gravida urna vulputate feugiat. Donec nulla quam, tempor vitae bibendum
      sed, ultricies ut magna. Sed varius condimentum metus eu ultricies.
      Phasellus lacus justo, faucibus ac efficitur a, lobortis suscipit odio.
      Sed sed blandit ipsum, ut pellentesque mauris. Duis viverra vehicula
      fringilla. Mauris nec tempus nulla. Nulla at tortor at est malesuada
      pharetra non ac neque. Integer vel scelerisque leo. Nam non nibh id nibh
      placerat semper ullamcorper et justo. Sed elementum euismod interdum. Cras
      a auctor purus. Etiam rhoncus pulvinar metus, sit amet mollis justo
      suscipit sed. Donec id tristique ante. Ut ut augue cursus, finibus nisi
      vel, egestas lectus. Donec eu dolor in justo hendrerit porttitor nec quis
      felis. Vestibulum ut fringilla arcu. Donec bibendum ex nec viverra
      imperdiet. Pellentesque sed elementum lorem. Integer rutrum neque diam, id
      vehicula sapien malesuada at. Morbi efficitur elit vel tempor congue. Nam
      a pulvinar odio. Sed nec lobortis diam. Proin fermentum lorem ligula, non
      sodales urna tempor vitae. Phasellus nec tincidunt nibh, ac vehicula
      purus. Mauris quis dolor ut ante egestas volutpat in ut libero. Integer eu
      nibh convallis nulla sodales mattis quis sit amet purus. Duis sed metus
      augue. Nam ac quam dignissim, tincidunt mauris feugiat, porttitor risus.
      Maecenas quis urna quis magna vulputate porta. Praesent a erat nisi. Donec
      pharetra imperdiet tellus, non lobortis nisi tincidunt et. Pellentesque
      laoreet, arcu in fermentum egestas, metus tellus feugiat erat, non pretium
      ex nibh in dolor. Sed in bibendum diam. Phasellus ante neque, dapibus a
      nunc eget, commodo laoreet tortor. Nullam aliquam vitae nisi eu tincidunt.
      Pellentesque tristique magna sed nulla rutrum porta. Donec tellus nulla,
      auctor et hendrerit posuere, consectetur vel turpis. Phasellus ac interdum
      diam. Suspendisse ullamcorper metus eu lacus varius euismod. Suspendisse
      est magna, sagittis ac erat quis, interdum interdum tortor. Maecenas
      sollicitudin est id condimentum eleifend. Suspendisse potenti. Vivamus
      hendrerit nulla quis viverra molestie. Suspendisse ut auctor tortor.
      Aliquam sed risus arcu. Donec pulvinar massa id felis malesuada fermentum.
      Ut eget diam nec ipsum mollis condimentum. Duis posuere in lectus non
      commodo. Curabitur tincidunt tristique scelerisque. Quisque porta diam
      risus, vitae blandit purus posuere id. Sed venenatis nisl ac risus laoreet
      ornare. Mauris vel justo dignissim, tristique nibh nec, fermentum felis.
      Suspendisse egestas massa congue metus mollis, eget venenatis urna
      eleifend. Fusce velit lorem, varius ac lectus porta, bibendum egestas
      tellus. Donec pellentesque justo sed fringilla finibus. Donec bibendum id
      diam sit amet facilisis. Etiam eu diam id libero ultrices ornare non eu
      enim. Vivamus et viverra urna. Etiam a tincidunt elit, a lobortis nisl. Ut
      consectetur tempor tellus sed egestas. Proin elementum quam ac elit
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
      tellus. Ut efficitur dolor nec magna tincidunt mollis eu eget nibh. Mauris
      sit amet interdum mauris, quis fringilla ex. Duis augue enim, gravida ac
      lectus fermentum, semper egestas magna. Sed at metus non magna tempus
      suscipit nec et massa. Pellentesque ut sem ut nunc gravida vehicula sit
      amet at felis. Suspendisse suscipit pulvinar ipsum, non eleifend velit
      ultrices eu. Maecenas vitae semper quam. Suspendisse molestie pulvinar
      lorem eu iaculis. Sed ut ligula nisl. Pellentesque habitant morbi
      tristique senectus et netus et malesuada fames ac turpis egestas. Vivamus
      in rhoncus sem. Etiam dignissim ex non efficitur ultricies. Vestibulum
      ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia
      curae; In finibus, orci et feugiat maximus, sem massa finibus nisi, ut
      viverra risus lacus vel est. Vestibulum semper blandit aliquam. Sed a orci
      dolor. Vivamus consequat eros urna, vel volutpat erat egestas quis.
      Integer accumsan lorem sit amet tristique maximus. Aenean pharetra commodo
      dolor. Suspendisse dapibus nibh eget volutpat tempus. Interdum et
      malesuada fames ac ante ipsum primis in faucibus. In feugiat scelerisque
      risus pharetra vestibulum. Praesent suscipit eget velit id laoreet. Morbi
      quis arcu gravida augue placerat pharetra vitae id dui. Nunc congue tempus
      eleifend. Ut sed vulputate sem. Vivamus dignissim est ut turpis consequat
      dignissim. Aenean eget facilisis dui, vitae rutrum eros. Nullam dignissim
      non ipsum a aliquet. Etiam dolor augue, sodales ac magna in, sagittis
      tempus leo. Maecenas eu sapien bibendum, consectetur nibh quis, ornare
      felis. Quisque ornare luctus lacus sed condimentum. Praesent lorem ex,
      efficitur sed orci eget, tincidunt egestas mi. Vivamus blandit sapien sit
      amet nunc consectetur feugiat. Cras tempor sagittis est, vitae mollis
      libero auctor at. Integer eget enim mollis, elementum arcu a, maximus
      diam. Interdum et malesuada fames ac ante ipsum primis in faucibus. Donec
      mi lectus, suscipit non dolor commodo, tempor blandit nunc. Interdum et
      malesuada fames ac ante ipsum primis in faucibus. Nulla pellentesque
      elementum risus scelerisque posuere. Nullam gravida lectus eget eros
      molestie bibendum. Suspendisse at elit porttitor, commodo tellus et,
      pharetra nisl. Ut fringilla, massa vel sagittis consectetur, tortor purus
      ornare risus, in molestie sem nibh in eros. Phasellus ac odio vel tellus
      posuere volutpat eu vitae augue. Maecenas finibus ultricies odio, sed
      gravida urna vulputate feugiat. Donec nulla quam, tempor vitae bibendum
      sed, ultricies ut magna. Sed varius condimentum metus eu ultricies.
      Phasellus lacus justo, faucibus ac efficitur a, lobortis suscipit odio.
      Sed sed blandit ipsum, ut pellentesque mauris. Duis viverra vehicula
      fringilla. Mauris nec tempus nulla. Nulla at tortor at est malesuada
      pharetra non ac neque. Integer vel scelerisque leo. Nam non nibh id nibh
      placerat semper ullamcorper et justo. Sed elementum euismod interdum. Cras
      a auctor purus. Etiam rhoncus pulvinar metus, sit amet mollis justo
      suscipit sed. Donec id tristique ante. Ut ut augue cursus, finibus nisi
      vel, egestas lectus. Donec eu dolor in justo hendrerit porttitor nec quis
      felis. Vestibulum ut fringilla arcu. Donec bibendum ex nec viverra
      imperdiet. Pellentesque sed elementum lorem. Integer rutrum neque diam, id
      vehicula sapien malesuada at. Morbi efficitur elit vel tempor congue. Nam
      a pulvinar odio. Sed nec lobortis diam. Proin fermentum lorem ligula, non
      sodales urna tempor vitae. Phasellus nec tincidunt nibh, ac vehicula
      purus. Mauris quis dolor ut ante egestas volutpat in ut libero. Integer eu
      nibh convallis nulla sodales mattis quis sit amet purus. Duis sed metus
      augue. Nam ac quam dignissim, tincidunt mauris feugiat, porttitor risus.
      Maecenas quis urna quis magna vulputate porta. Praesent a erat nisi. Donec
      pharetra imperdiet tellus, non lobortis nisi tincidunt et. Pellentesque
      laoreet, arcu in fermentum egestas, metus tellus feugiat erat, non pretium
      ex nibh in dolor. Sed in bibendum diam. Phasellus ante neque, dapibus a
      nunc eget, commodo laoreet tortor. Nullam aliquam vitae nisi eu tincidunt.
      Pellentesque tristique magna sed nulla rutrum porta. Donec tellus nulla,
      auctor et hendrerit posuere, consectetur vel turpis. Phasellus ac interdum
      diam. Suspendisse ullamcorper metus eu lacus varius euismod. Suspendisse
      est magna, sagittis ac erat quis, interdum interdum tortor. Maecenas
      sollicitudin est id condimentum eleifend. Suspendisse potenti. Vivamus
      hendrerit nulla quis viverra molestie. Suspendisse ut auctor tortor.
      Aliquam sed risus arcu. Donec pulvinar massa id felis malesuada fermentum.
      Ut eget diam nec ipsum mollis condimentum. Duis posuere in lectus non
      commodo. Curabitur tincidunt tristique scelerisque. Quisque porta diam
      risus, vitae blandit purus posuere id. Sed venenatis nisl ac risus laoreet
      ornare. Mauris vel justo dignissim, tristique nibh nec, fermentum felis.
      Suspendisse egestas massa congue metus mollis, eget venenatis urna
      eleifend. Fusce velit lorem, varius ac lectus porta, bibendum egestas
      tellus. Donec pellentesque justo sed fringilla finibus. Donec bibendum id
      diam sit amet facilisis. Etiam eu diam id libero ultrices ornare non eu
      enim. Vivamus et viverra urna. Etiam a tincidunt elit, a lobortis nisl. Ut
      consectetur tempor tellus sed egestas. Proin elementum quam ac elit
    </main>
  `,
}
