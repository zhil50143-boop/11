# Chapter 01 scene wiring (Cocos Creator 3.8.8)

This branch adds runtime components and story JSON interactions. The repository does not yet contain serialized Cocos scene assets, so create the three scenes in Creator and bind scripts as described below before building.

## Project setup
- Open the repository in Cocos Creator 3.8.8.
- Set design resolution to 1080 × 1920 and portrait orientation.
- Add assets/scenes/Boot.scene, Main.scene, and Story.scene to Build Profiles in that order, with Boot as the launch scene.
- Keep story JSON under assets/resources/data/story/chapter01/; resource paths omit the .json extension.

## Boot.scene
Create a root node and add the Boot component. Its start() loads the scene named Main.

## Main.scene
Create a Canvas with a root node carrying Main. Add three buttons and assign them to startButton, continueButton, and newGameButton. Start and Continue load Story; New Game clears the local save first.

## Story.scene
Create a Canvas and a root node with Story, StoryManager, and StoryFlow components.

Create and bind:
- Dialogue root: add DialoguePanel; assign a speaker Label, body Label, and optional continue hint.
- Choice root: add ChoicePanel; create three Button children and one Label per button; assign arrays in the same order.
- Memory interaction root: add MemoryInteractionPanel; assign title, body, and action Labels. Assign this node to StoryFlow.interactionPanel and its component to StoryFlow.memoryPanel. The panel touch completes the current photo, letter, investigation, audio, or transition beat.
- Continue button: assign its Node to StoryFlow.continueButton.
- Assign StoryManager, dialogue, and choices to StoryFlow; assign manager and flow to Story.

Use a UI camera that sees the Canvas layer. Keep buttons at least 96 px high for touch use. The branch contains no original photo art or MP3 audio asset yet: current interactions render authored text and track identifiers; actual image/audio playback requires those assets to be supplied and wired.

## Local verification
Check that every local next/choice/condition target exists, except an episodeEnd target may name the next episode or the manifest's nextChapter marker. Then open Story in Preview and play through to the bus choice. Confirm refresh restores the saved episode/node.