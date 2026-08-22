"""
shared/constants.py
===================
Mapeos oficiales de Riot Games para Valorant:
- UUIDs de agentes a nombres canónicos y viceversa.
- Nombres de mapas y armas.
"""

AGENT_UUID_TO_NAME_MAP: dict[str, str] = {
    "e370fa57-4757-3604-3648-499e1f642d3f": "gekko",
    "dade69b4-4f5a-8528-247b-219e5a1facd6": "fade",
    "5f8d3a7f-467b-97f3-062c-13acf203c006": "breach",
    "cc8b64c8-4b25-4ff9-6e7f-37b4da43d235": "deadlock",
    "b444168c-4e35-8076-db47-ef9bf368f384": "tejo",
    "f94c3b30-42be-e959-889c-5aa313dba261": "raze",
    "22697a3d-45bf-8dd7-4fec-84a9e28c69d7": "chamber",
    "601dbbe7-43ce-be57-2a40-4abd24953621": "kayo",
    "6f2a04ca-43e0-be17-7f36-b3908627744d": "skye",
    "117ed9e3-49f3-6512-3ccf-0cada7e3823b": "cypher",
    "320b2a48-4d9b-a075-30f1-1f93a9b638fa": "sova",
    "7c8a4701-4de6-9355-b254-e09bc2a34b72": "miks",
    "1e58de9c-4950-5125-93e9-a0aee9f98746": "killjoy",
    "95b78ed7-4637-86d9-7e41-71ba8c293152": "harbor",
    "efba5359-4016-a1e5-7626-b1ae76895940": "vyse",
    "707eab51-4836-f488-046a-cda6bf494859": "viper",
    "eb93336a-449b-9c1b-0a54-a891f7921d69": "phoenix",
    "92eeef5d-43b5-1d4a-8d03-b3927a09034b": "veto",
    "41fb69c1-4189-7b37-f117-bcaf1e96f1bf": "astra",
    "9f0d8ba9-4140-b941-57d3-a7ad57c6b417": "brimstone",
    "0e38b510-41a8-5780-5e8f-568b2a4f2d6c": "iso",
    "1dbf2edd-4729-0984-3115-daa5eed44993": "clove",
    "bb2a4828-46eb-8cd1-e765-15848195d751": "neon",
    "7f94d92c-4234-0a36-9646-3a87eb8b5c89": "yoru",
    "df1cb487-4902-002e-5c17-d28e83e78588": "waylay",
    "569fdd95-4d10-43ab-ca70-79becc718b46": "sage",
    "a3bfb853-43b2-7238-a4f1-ad90e9e46bcc": "reyna",
    "8e253930-4c05-31dd-1b6c-968525494517": "omen",
    "add6443a-41bd-e414-f6ad-e58d267f4e95": "jett",
}

AGENT_NAME_TO_UUID_MAP: dict[str, str] = {
    agent_name: agent_uuid for agent_uuid, agent_name in AGENT_UUID_TO_NAME_MAP.items()
}


def normalize_agent_identifier(raw_identifier: str) -> str:
    """Convierte cualquier UUID o nombre al nombre canónico limpio en minúsculas."""
    cleaned = str(raw_identifier).strip().lower()
    if cleaned in AGENT_UUID_TO_NAME_MAP:
        return AGENT_UUID_TO_NAME_MAP[cleaned]
    return cleaned
