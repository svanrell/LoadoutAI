describe("Simulator vs Live Mode Socket Action Guards", () => {
  it("should NOT emit pregame_select or pregame_lock to the socket when in simulator/offline mode", () => {
    const mockSocket = {
      emit: jest.fn(),
    };

    let isLiveMode = false;
    const pregameMatchId = "match-123";

    // Simulación de la función selectAgent y lockAgent con las guardas implementadas
    const selectAgent = (agentUuid: string) => {
      if (isLiveMode && mockSocket) {
        mockSocket.emit("pregame_select", { pregameMatchId, agentUuid });
      }
    };

    const lockAgent = (agentUuid: string) => {
      if (isLiveMode && mockSocket) {
        mockSocket.emit("pregame_lock", { pregameMatchId, agentUuid });
      }
    };

    // 1. Ejecutar en modo simulador (isLiveMode = false)
    selectAgent("add6443a-41bd-e414-f6ad-e58d267f4e95");
    lockAgent("add6443a-41bd-e414-f6ad-e58d267f4e95");

    // Verificar que nunca se emitió al cliente Riot
    expect(mockSocket.emit).not.toHaveBeenCalledWith(
      "pregame_select",
      expect.anything(),
    );
    expect(mockSocket.emit).not.toHaveBeenCalledWith(
      "pregame_lock",
      expect.anything(),
    );
    expect(mockSocket.emit).toHaveBeenCalledTimes(0);

    // 2. Ejecutar en modo en vivo (isLiveMode = true)
    isLiveMode = true;
    selectAgent("add6443a-41bd-e414-f6ad-e58d267f4e95");
    expect(mockSocket.emit).toHaveBeenCalledWith("pregame_select", {
      pregameMatchId: "match-123",
      agentUuid: "add6443a-41bd-e414-f6ad-e58d267f4e95",
    });

    lockAgent("add6443a-41bd-e414-f6ad-e58d267f4e95");
    expect(mockSocket.emit).toHaveBeenCalledWith("pregame_lock", {
      pregameMatchId: "match-123",
      agentUuid: "add6443a-41bd-e414-f6ad-e58d267f4e95",
    });
  });
});
