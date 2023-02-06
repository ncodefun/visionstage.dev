# Vision Stage

## VisionStage.aspects

Gives you artistic control over the look of your app within different viewport aspects.

First, the rem value is scaled relative to the stage's vertical* space (default to 40rem), so content using the rem/em units for sizing will scale accordingly. That means consistent v-space* - the amount of content that fits vertically will remain the same accross screens with different aspects, or expand on narrow screens (* scaling is relative to horizontal space when AR < `portrait`'s ratio). This way, content doesn't scale down more on small/narrow screens, which is naturally what we want- i.e. to have content bigger on small devices, even if this means to have less space for it.

So with that, you only have to care about the varying horizontal space; there is less on narrow screens, and no or little more vertical space, so we may need to hide some elements (or ask the user to rotate the device in landscape orientation).

Optionally, using aspect-ratio boundaries provides a neat way to frame your landscape and portrait layouts by keeping the stage's dimensions within specific aspect-ratios. This prevents the layout to extend or contract to much, so you don't have to manage how your content displays within extreme or in-between aspect-ratios.
