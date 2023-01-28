# vs-selector

## Standard selector
[folds] => menu hides or shows on click
[direction='vertical']
.options => array of options
.selected => index selected || null -> shows text content
or

## Tabs
![folds] [direction='horizontal']

### Radio buttons style
[icon='radio'] [direction='vertical']

### Multi choices
![folds] [multi]
.selections => array of selected indices (replaces .selected prop)
[icon='checkbox|bar|led|none(color)']

## Checkbox
no .options => shows text content
.selected => boolean

