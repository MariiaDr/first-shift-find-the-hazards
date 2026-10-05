window.InitUserScripts = function()
{
var player = GetPlayer();
var object = player.object;
var once = player.once;
var addToTimeline = player.addToTimeline;
var setVar = player.SetVar;
var getVar = player.GetVar;
var update = player.update;
var pointerX = player.pointerX;
var pointerY = player.pointerY;
var showPointer = player.showPointer;
var hidePointer = player.hidePointer;
var slideWidth = player.slideWidth;
var slideHeight = player.slideHeight;
var getKeyDown = player.getKeyDown;
var keydown = player.keydown;
var keyup = player.keyup;
window.Script1 = function()
{
  (() => {
  const previousNpc = window.ppeNpc;

  // Удаляем обработчики NPC со скрытого слоя
  if (previousNpc) {
    if (previousNpc.onKeyDown) {
      window.removeEventListener('keydown', previousNpc.onKeyDown, true);
    }

    if (previousNpc.onKeyUp) {
      window.removeEventListener('keyup', previousNpc.onKeyUp, true);
    }

    if (previousNpc.onBlur) {
      window.removeEventListener('blur', previousNpc.onBlur);
    }
  }

  // Останавливаем старый update-цикл NPC
  window.ppeNpcControllerId =
    (window.ppeNpcControllerId || 0) + 1;

  window.ppeNpc = null;
  window.ppeNpcInputActive = false;

  // Сбрасываем одноразовый сигнал перехода
  setVar('ppeNpcArrived', 0);
})();
}

window.Script2 = function()
{
  (() => {
  const CHARACTER_ID = '6TDe6PxPCxy';
  const character = object(CHARACTER_ID);

  // Запретные зоны
  const noWalkZone1 = object('5akBMpZo7FW');
  const noWalkZone2 = object('6EiSYA0fIDl');
  const noWalkZone3 = object('5gv055SY652');
  const noWalkZone4 = object('5X6nJfdDjZw');

  // Интерактивные зоны
  const packingZone = object('6f9FKPQinJa');
  const storageAisle = object('6np0crxdxJs');
  const loadingBay = object('5z7HClQWzZc');

  // Очищаем сценарий NPC после возврата на карту
  const previousNpc = window.ppeNpc;

  if (previousNpc) {
    if (previousNpc.onKeyDown) {
      window.removeEventListener('keydown', previousNpc.onKeyDown, true);
    }

    if (previousNpc.onKeyUp) {
      window.removeEventListener('keyup', previousNpc.onKeyUp, true);
    }

    if (previousNpc.onBlur) {
      window.removeEventListener('blur', previousNpc.onBlur);
    }
  }

  window.ppeNpcControllerId =
    (window.ppeNpcControllerId || 0) + 1;

  window.ppeNpc = null;
  window.ppeNpcInputActive = false;

  // Сброс сигналов показа слоёв
  setVar('ppeNpcArrived', 0);
  setVar('nearPackingZone', 0);
  setVar('nearStorageAisle', 0);
  setVar('nearLoadingBay', 0);

  // Получаем состояние интерактивных зон до перезапуска карты
  const previousGame = window.game;
  const savedZoneStates = {};

  if (previousGame) {
    if (previousGame.interactionZones) {
      previousGame.interactionZones.forEach((zoneData) => {
        savedZoneStates[zoneData.variable] = zoneData.inside;
      });
    }

    if (previousGame.onKeyDown) {
      window.removeEventListener('keydown', previousGame.onKeyDown, true);
    }

    if (previousGame.onKeyUp) {
      window.removeEventListener('keyup', previousGame.onKeyUp, true);
    }

    if (previousGame.onBlur) {
      window.removeEventListener('blur', previousGame.onBlur);
    }
  }

  window.characterControllerId =
    (window.characterControllerId || 0) + 1;

  const controllerId = window.characterControllerId;

  window.game = {
    // Скорость: пикселей в секунду
    speed: 120,

    // Дополнительное расстояние до препятствий
    collisionPadding: 20,

    // Внешние границы карты
    topBoundary: 96,
    botBoundary: 772,
    leftBoundary: 414,
    rightBoundary: 1274,

    idleState: 'Normal',
    heldKeys: new Set(),

    // Настройки ручной анимации A/B
    frameInterval: 260,
    walkFrameA: true,
    lastFrameChange: performance.now(),
    walkDirection: null,
    wasMoving: false,

    walkStates: {
      up: ['Walk Up A', 'Walk Up B'],
      left: ['Walk Left A', 'Walk Left B'],
      right: ['Walk Right A', 'Walk Right B'],
      down: ['Walk Down A', 'Walk Down B']
    },

    idleStates: {
      up: 'Normal',
      left: 'Left',
      right: 'Right',
      down: 'Down1'
    },

    blockers: [
      noWalkZone1,
      noWalkZone2,
      noWalkZone3,
      noWalkZone4
    ],

    interactionZones: [
      {
        obj: packingZone,
        variable: 'nearPackingZone',
        inside: typeof savedZoneStates.nearPackingZone === 'boolean'
          ? savedZoneStates.nearPackingZone
          : null
      },
      {
        obj: storageAisle,
        variable: 'nearStorageAisle',
        inside: typeof savedZoneStates.nearStorageAisle === 'boolean'
          ? savedZoneStates.nearStorageAisle
          : null
      },
      {
        obj: loadingBay,
        variable: 'nearLoadingBay',
        inside: typeof savedZoneStates.nearLoadingBay === 'boolean'
          ? savedZoneStates.nearLoadingBay
          : null
      }
    ],

    interactionLocked: false,
    activeInteraction: null,

    controllerId: controllerId
  };

  const game = window.game;

  const keyDirections = {
    KeyW: 'up',
    ArrowUp: 'up',

    KeyA: 'left',
    ArrowLeft: 'left',

    KeyD: 'right',
    ArrowRight: 'right',

    KeyS: 'down',
    ArrowDown: 'down'
  };

  // Проверка столкновения с препятствиями
  game.canMoveTo = (nextX, nextY) => {
    const padding = game.collisionPadding;

    return !game.blockers.some((zone) => {
      const zoneLeft = zone.x - padding;
      const zoneRight = zone.x + zone.width + padding;
      const zoneTop = zone.y - padding;
      const zoneBottom = zone.y + zone.height + padding;

      return (
        nextX < zoneRight &&
        nextX + character.width > zoneLeft &&
        nextY < zoneBottom &&
        nextY + character.height > zoneTop
      );
    });
  };

  // Проверка границ карты и препятствий
  game.isAllowedPosition = (nextX, nextY) => {
    const isInsideMap =
      nextX >= game.leftBoundary &&
      nextX <= game.rightBoundary &&
      nextY >= game.topBoundary &&
      nextY <= game.botBoundary;

    return isInsideMap && game.canMoveTo(nextX, nextY);
  };

  // Проверка пересечения персонажа и интерактивной зоны
  game.isCharacterInsideZone = (zone) => {
    return (
      character.x < zone.x + zone.width &&
      character.x + character.width > zone.x &&
      character.y < zone.y + zone.height &&
      character.y + character.height > zone.y
    );
  };

  // Если зона не была сохранена, определяем стартовое состояние по позиции
  game.interactionZones.forEach((zoneData) => {
    if (typeof zoneData.inside !== 'boolean') {
      zoneData.inside = game.isCharacterInsideZone(zoneData.obj);
    }
  });

  // Блокировка управления на время открытого слоя
  game.lockInteraction = (variable) => {
    if (game.interactionLocked) return;

    game.interactionLocked = true;
    game.activeInteraction = variable;

    game.heldKeys.clear();
    game.wasMoving = false;
    game.walkDirection = null;
    character.state = game.idleState;
  };

  // Вызывается кнопкой закрытия слоя
  game.resumeInteraction = (variable) => {
    if (game.activeInteraction !== variable) return;

    game.interactionLocked = false;
    game.activeInteraction = null;

    setVar(variable, 0);
  };

  // Проверка входа/выхода из интерактивных зон
  game.updateInteractionZones = () => {
    game.interactionZones.forEach((zoneData) => {
      const isInside = game.isCharacterInsideZone(zoneData.obj);

      if (isInside !== zoneData.inside) {
        zoneData.inside = isInside;

        if (isInside) {
          game.lockInteraction(zoneData.variable);
          setVar(zoneData.variable, 1);
        } else {
          setVar(zoneData.variable, 0);
        }
      }
    });
  };

  // Выбираем направление и первый кадр A
  game.setDirection = (direction) => {
    if (!direction) return;

    game.idleState = game.idleStates[direction];

    if (game.walkDirection !== direction) {
      game.walkDirection = direction;
      game.walkFrameA = true;
      game.lastFrameChange = performance.now();

      character.state = game.walkStates[direction][0];
    }
  };

  game.onKeyDown = (event) => {
    if (
      window.ppeNpcInputActive ||
      game.interactionLocked
    ) {
      return;
    }

    const direction = keyDirections[event.code];
    if (!direction) return;

    game.heldKeys.add(event.code);
    game.setDirection(direction);
  };

  game.onKeyUp = (event) => {
    const direction = keyDirections[event.code];
    if (!direction) return;

    game.heldKeys.delete(event.code);

    if (game.heldKeys.size > 0) {
      const keys = Array.from(game.heldKeys);
      const lastHeldKey = keys[keys.length - 1];

      game.setDirection(keyDirections[lastHeldKey]);
      return;
    }

    game.wasMoving = false;
    game.walkDirection = null;
    character.state = game.idleState;
  };

  game.onBlur = () => {
    game.heldKeys.clear();
    game.wasMoving = false;
    game.walkDirection = null;
    character.state = game.idleState;
  };

  window.addEventListener('keydown', game.onKeyDown, true);
  window.addEventListener('keyup', game.onKeyUp, true);
  window.addEventListener('blur', game.onBlur);

  let lastUpdateTime = performance.now();

  update(() => {
    if (
      window.characterControllerId !== controllerId ||
      window.game !== game
    ) {
      return;
    }

    const now = performance.now();

    const deltaSeconds = Math.min(
      (now - lastUpdateTime) / 1000,
      0.05
    );

    lastUpdateTime = now;

    // Основной персонаж не двигается во время NPC-сцены
    if (window.ppeNpcInputActive) {
      game.heldKeys.clear();
      game.wasMoving = false;
      character.state = game.idleState;
      return;
    }

    // Основной персонаж не двигается, пока открыт слой зоны
    if (game.interactionLocked) {
      game.heldKeys.clear();
      game.wasMoving = false;
      character.state = game.idleState;
      return;
    }

    let axisX = 0;
    let axisY = 0;

    if (
      game.heldKeys.has('KeyA') ||
      game.heldKeys.has('ArrowLeft')
    ) {
      axisX -= 1;
    }

    if (
      game.heldKeys.has('KeyD') ||
      game.heldKeys.has('ArrowRight')
    ) {
      axisX += 1;
    }

    if (
      game.heldKeys.has('KeyW') ||
      game.heldKeys.has('ArrowUp')
    ) {
      axisY -= 1;
    }

    if (
      game.heldKeys.has('KeyS') ||
      game.heldKeys.has('ArrowDown')
    ) {
      axisY += 1;
    }

    let moved = false;

    if (axisX === 0 && axisY === 0) {
      game.wasMoving = false;
      character.state = game.idleState;
    } else {
      const vectorLength = Math.hypot(axisX, axisY);

      const stepX =
        (axisX / vectorLength) * game.speed * deltaSeconds;

      const stepY =
        (axisY / vectorLength) * game.speed * deltaSeconds;

      // Проверяем оси отдельно, поэтому можно идти вдоль стен
      if (
        stepX !== 0 &&
        game.isAllowedPosition(character.x + stepX, character.y)
      ) {
        character.x += stepX;
        moved = true;
      }

      if (
        stepY !== 0 &&
        game.isAllowedPosition(character.x, character.y + stepY)
      ) {
        character.y += stepY;
        moved = true;
      }

      if (!moved) {
        game.wasMoving = false;
        character.state = game.idleState;
      } else {
        if (!game.wasMoving && game.walkDirection) {
          game.walkFrameA = true;
          game.lastFrameChange = now;
          character.state =
            game.walkStates[game.walkDirection][0];
        }

        game.wasMoving = true;

        if (
          game.walkDirection &&
          now - game.lastFrameChange >= game.frameInterval
        ) {
          game.walkFrameA = !game.walkFrameA;

          const states = game.walkStates[game.walkDirection];

          character.state = game.walkFrameA
            ? states[0]
            : states[1];

          game.lastFrameChange = now;
        }
      }
    }

    // Проверяем зоны после движения
    game.updateInteractionZones();
  });
})();
}

window.Script3 = function()
{
  // D
window.game.pressKey('KeyD');
}

window.Script4 = function()
{
  // W
window.game.pressKey('KeyW');
}

window.Script5 = function()
{
  // S
window.game.pressKey('KeyS');
}

window.Script6 = function()
{
  // A
window.game.pressKey('KeyA');
}

window.Script7 = function()
{
  // Кнопка закрытия слоя LOADING BAY
window.game.resumeInteraction('nearLoadingBay');
}

window.Script8 = function()
{
  // Закрываем текущую интерактивную блокировку и сбрасываем сигнал слоя
window.game.resumeInteraction('nearStorageAisle');
}

window.Script9 = function()
{
  // Кнопка закрытия слоя STORAGE AISLE
window.game.resumeInteraction('nearStorageAisle');
}

window.Script10 = function()
{
  // Кнопка закрытия слоя PACKING ZONE
window.game.resumeInteraction('nearPackingZone');
}

window.Script11 = function()
{
  // Кнопка закрытия слоя PACKING ZONE
window.game.resumeInteraction('nearPackingZone');
}

window.Script12 = function()
{
  if (window.ppeNpcInputActive && window.ppeNpc) {
  window.ppeNpc.startMove();
}
}

window.Script13 = function()
{
  (() => {
  const NPC_ID = '6mV2URXqEEp';

  const targetX = 848;
  const targetY = 574;

  // Скорость движения: пикселей в секунду
  const speed = 90;
  const transitionDelay = 600; // задержка в миллисекундах

  // Интервал смены Walk Up A / Walk Up B
  const frameInterval = 260;

  // Сбрасываем сигнал перехода при открытии слоя
  setVar('ppeNpcArrived', 0);

  const previousNpc = window.ppeNpc;

  if (previousNpc) {
    if (previousNpc.onKeyDown) {
      window.removeEventListener('keydown', previousNpc.onKeyDown, true);
    }

    if (previousNpc.onKeyUp) {
      window.removeEventListener('keyup', previousNpc.onKeyUp, true);
    }

    if (previousNpc.onBlur) {
      window.removeEventListener('blur', previousNpc.onBlur);
    }
  }

  window.ppeNpcControllerId =
    (window.ppeNpcControllerId || 0) + 1;

  const controllerId = window.ppeNpcControllerId;
  const npc = object(NPC_ID);

  window.ppeNpc = {
    targetX,
    targetY,
    speed,
    frameInterval,
    heldW: false,
    finished: false,
    walkFrameA: true,
    lastFrameChange: performance.now(),
    controllerId
  };

  const game = window.ppeNpc;
  
  window.ppeNpcInputActive = true;

  // Вызывается скриптом кнопки W
  game.startMove = () => {
    if (!game.finished) {
      game.heldW = true;
    }
  };

  game.onKeyDown = (event) => {
    if (event.code === 'KeyW' && !game.finished) {
      game.heldW = true;
    }
  };

  game.onKeyUp = (event) => {
    if (event.code === 'KeyW') {
      game.heldW = false;

      const currentNpc = object(NPC_ID);
      currentNpc.state = 'Normal';
    }
  };

  game.onBlur = () => {
    game.heldW = false;

    const currentNpc = object(NPC_ID);
    currentNpc.state = 'Normal';
  };

  window.addEventListener('keydown', game.onKeyDown, true);
  window.addEventListener('keyup', game.onKeyUp, true);
  window.addEventListener('blur', game.onBlur);

  let lastUpdateTime = performance.now();

  update(() => {
    if (
      window.ppeNpcControllerId !== controllerId ||
      window.ppeNpc !== game
    ) {
      return;
    }

    const now = performance.now();

    const deltaSeconds = Math.min(
      (now - lastUpdateTime) / 1000,
      0.05
    );

    lastUpdateTime = now;

    // W отпущена — персонаж стоит
    if (!game.heldW || game.finished) {
      npc.state = 'Normal';
      return;
    }

    const deltaX = game.targetX - npc.x;
    const deltaY = game.targetY - npc.y;
    const distance = Math.hypot(deltaX, deltaY);

    // Точка достигнута
    if (distance <= 0.5) {
	  npc.x = game.targetX;
	  npc.y = game.targetY;
	  npc.state = 'Normal';
	  game.finished = true;
	
	  // Пока идёт задержка, W всё ещё не управляет основным персонажем
	  window.setTimeout(() => {
	    // Не выполняем переход, если слой был заново открыт
	    if (
	      window.ppeNpcControllerId !== controllerId ||
	      window.ppeNpc !== game
	    ) {
	      return;
	    }
	
	    window.ppeNpcInputActive = false;
	    setVar('ppeNpcArrived', 1);
	  }, transitionDelay);
	
	  return;
	}

    // Непрерывное движение к точке, пока удерживается W
    const moveDistance = Math.min(
      game.speed * deltaSeconds,
      distance
    );

    npc.x += (deltaX / distance) * moveDistance;
    npc.y += (deltaY / distance) * moveDistance;

    // Чередуем два статичных кадра ходьбы
    if (now - game.lastFrameChange >= game.frameInterval) {
      game.walkFrameA = !game.walkFrameA;
      npc.state = game.walkFrameA ? 'Walk Up A' : 'Walk Up B';
      game.lastFrameChange = now;
    }
  });
})();
}

};
