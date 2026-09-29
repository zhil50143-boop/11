# Chapter 01 scene wiring (Cocos Creator 3.8.8)

The repository now contains serialized `Boot`, `Main`, and `Story` scene assets under `assets/scenes/`. `Main` and `Story` build their fallback controls and panels at runtime, so the slice does not depend on inspector drag-and-drop references. The scene scripts remain editable in Creator; authored inspector references can replace the fallback nodes.

## Project setup
- Open the repository in Cocos Creator 3.8.8.
- Set design resolution to 1080 × 1920 and portrait orientation.
- Add `assets/scenes/Boot.scene`, `Main.scene`, and `Story.scene` to Build Profiles in that order, with Boot as the launch scene.
- Keep story JSON under assets/resources/data/story/chapter01/; resource paths omit the .json extension.

## Boot.scene
The scene contains a UI camera, Canvas, and Boot component. Its `start()` loads the scene named `Main`.

## Main.scene
The Canvas root carries Main. If the three optional button properties are empty, `Main` creates Start, Continue, and New Game touch targets. Start and Continue load Story; New Game clears the local save first.

## Story.scene
The Canvas root carries Story. At load, it adds StoryManager and StoryFlow, creates dialogue and choice panels, and connects the references. The memory panel handles the photo, letter, investigation, audio, and transition interactions; tapping it advances the current beat.

Use a UI camera that sees the Canvas layer. Keep buttons at least 96 px high for touch use. The branch contains no original photo art or MP3 audio asset yet: current interactions render authored text and track identifiers; actual image/audio playback requires those assets to be supplied and wired.

## Local verification
Run `npm test` to check the story graph, serialized scene object references, script UUID bindings, and TypeScript types. Then open the project in Creator 3.8.8, add the three scenes to Build Profiles, and play through to the bus choice. Confirm refresh restores the saved episode/node. This repository snapshot has not yet been opened in Creator Preview, so that final editor/runtime check remains outstanding.
