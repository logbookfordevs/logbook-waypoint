import { describe, expect, it } from 'vitest';
import { createRafDriver, getProject } from '@theatre/core';
import { ANNOTATION_TIME, END_TIME, SHEET_NAME, composition, destinationAfter, projectState } from '@/app/labs/theatre/score';

describe('Theatre authored cut', () => {
  it('reconstructs Annotation and Queue identically after forward and reverse seeking', async () => {
    const project = getProject('Waypoint score test', { state: projectState });
    await project.ready;
    const sheet = project.sheet(SHEET_NAME);
    const object = sheet.object('Composition', composition);
    sheet.sequence.position = ANNOTATION_TIME;
    const annotation = object.value;
    expect(annotation.mark).toBe(1);
    expect(annotation.note).toBe(1);
    expect(annotation.queue).toBe(0);
    sheet.sequence.position = END_TIME;
    expect(object.value.queue).toBe(1);
    expect(object.value.note).toBe(0);
    sheet.sequence.position = ANNOTATION_TIME;
    expect(object.value).toEqual(annotation);
    sheet.sequence.position = 0;
    expect(object.value.hero).toBe(1);
    expect(object.value.mark).toBe(0);
  });

  it('holds at Annotation before allowing the second leg', () => {
    expect(destinationAfter(0)).toBe(ANNOTATION_TIME);
    expect(destinationAfter(9.9)).toBe(ANNOTATION_TIME);
    expect(destinationAfter(ANNOTATION_TIME)).toBe(END_TIME);
  });

  it('stops the authored first leg at Annotation even when more frame time arrives', async () => {
    const project = getProject('Waypoint playback test', { state: projectState });
    await project.ready;
    const cut = project.sheet(SHEET_NAME);
    cut.object('Composition', composition);
    const driver = createRafDriver({ name: 'bounded test clock' });
    driver.tick(0);
    const playback = cut.sequence.play({ range: [0, ANNOTATION_TIME], rafDriver: driver });
    for (let time = 0; time <= 12000; time += 100) driver.tick(time);
    expect(await playback).toBe(true);
    expect(cut.sequence.position).toBe(ANNOTATION_TIME);
    driver.tick(20000);
    expect(cut.sequence.position).toBe(ANNOTATION_TIME);
  });
});
