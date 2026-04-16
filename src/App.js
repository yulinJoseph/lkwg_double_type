import { useState } from "react";
import "./App.css";
import relation from "./relation.json";

function App() {
    const types = [
        { key: "huo", name: "火" },
        { key: "shui", name: "水" },
        { key: "cao", name: "草" },
        { key: "guang", name: "光" },
        { key: "e", name: "恶" },
        { key: "you", name: "幽" },
        { key: "putong", name: "普通" },
        { key: "di", name: "地" },
        { key: "bing", name: "冰" },
        { key: "dian", name: "电" },
        { key: "du", name: "毒" },
        { key: "chong", name: "虫" },
        { key: "wu", name: "武" },
        { key: "yi", name: "翼" },
        { key: "meng", name: "萌" },
        { key: "jixie", name: "机械" },
        { key: "huan", name: "幻" },
        { key: "long", name: "龙" },
    ];
    const [groups, setGroups] = useState([{ id: "group-1", selected: [] }]);
    const [activeGroup, setActiveGroup] = useState("group-1");
    const [nextGroupId, setNextGroupId] = useState(2);
    const allTypeKeys = types.map((item) => item.key);
    const typeNameMap = Object.fromEntries(types.map((item) => [item.key, item.name]));

    const toggleType = (key) => {
        setGroups((prev) =>
            prev.map((group) => {
                if (group.id !== activeGroup) {
                    return group;
                }
                const current = group.selected;
                if (current.includes(key)) {
                    return { ...group, selected: current.filter((item) => item !== key) };
                }
                if (current.length >= 2) {
                    return group;
                }
                return { ...group, selected: [...current, key] };
            }),
        );
    };

    const addGroup = () => {
        const newId = `group-${nextGroupId}`;
        setGroups((prev) => [...prev, { id: newId, selected: [] }]);
        setActiveGroup(newId);
        setNextGroupId((prev) => prev + 1);
    };

    const removeGroup = (groupId) => {
        if (groups.length <= 1) {
            return;
        }
        const nextGroups = groups.filter((group) => group.id !== groupId);
        setGroups(nextGroups);
        if (activeGroup === groupId) {
            setActiveGroup(nextGroups[0].id);
        }
    };

    const currentGroup = groups.find((group) => group.id === activeGroup) || groups[0];
    const currentSelected = currentGroup?.selected || [];

    const groupSlots = (selectedKeys) => [0, 1].map((index) => types.find((item) => item.key === selectedKeys[index]) || null);

    const getAttackMultiplier = (selectedKeys, defenderKey) =>
        selectedKeys.reduce((multiplier, attackerKey) => {
            const attacker = relation[attackerKey]?.attack;
            if (!attacker) {
                return multiplier;
            }
            if (attacker.SuperEffective.includes(defenderKey)) {
                return multiplier * 2;
            }
            if (attacker.NotVeryEffective.includes(defenderKey)) {
                return multiplier * 0.5;
            }
            return multiplier;
        }, 1);

    const getDefenseMultiplier = (selectedKeys, attackerKey) =>
        selectedKeys.reduce((multiplier, defenderKey) => {
            const defender = relation[defenderKey]?.defense;
            if (!defender) {
                return multiplier;
            }
            if (defender.SuperEffective.includes(attackerKey)) {
                return multiplier * 2;
            }
            if (defender.NotVeryEffective.includes(attackerKey)) {
                return multiplier * 0.5;
            }
            return multiplier;
        }, 1);

    const buildBuckets = (multiplierMap) => {
        const result = {
            super4: [],
            super2: [],
            resistHalf: [],
            resistQuarter: [],
        };

        allTypeKeys.forEach((typeKey) => {
            const multiplier = multiplierMap[typeKey];
            if (multiplier === 4) {
                result.super4.push(typeKey);
            } else if (multiplier > 1) {
                result.super2.push(typeKey);
            } else if (multiplier === 0.25) {
                result.resistQuarter.push(typeKey);
            } else if (multiplier < 1) {
                result.resistHalf.push(typeKey);
            }
        });

        return result;
    };

    const analyzeGroup = (selectedKeys) => {
        if (selectedKeys.length === 0) {
            return null;
        }

        const attackMap = {};
        const defenseMap = {};

        allTypeKeys.forEach((typeKey) => {
            attackMap[typeKey] = getAttackMultiplier(selectedKeys, typeKey);
            defenseMap[typeKey] = getDefenseMultiplier(selectedKeys, typeKey);
        });

        return {
            attack: buildBuckets(attackMap),
            defense: buildBuckets(defenseMap),
        };
    };

    const renderTypeTags = (typeKeys) => {
        if (typeKeys.length === 0) {
            return <span className="empty-text">无</span>;
        }

        return typeKeys.map((typeKey) => (
            <span key={typeKey} className="tag-item">
                <img src={`assets/type/${typeKey}.png`} alt={typeNameMap[typeKey]} className="tag-icon" />
                <span className="tag-name">{typeNameMap[typeKey]}</span>
            </span>
        ));
    };

    const renderStrongSection = (title, super2List, super4List, label) => (
        <div className="effect-section">
            <div className="effect-title">{title}</div>
            <div className="effect-row">
                <span className="effect-label">{label}（2x）</span>
                <div className="effect-values">{renderTypeTags(super2List)}</div>
            </div>
            <div className="effect-row">
                <span className="effect-label">{label}（4x）</span>
                <div className="effect-values">{renderTypeTags(super4List)}</div>
            </div>
        </div>
    );

    const renderResistSection = (title, halfList, quarterList, label) => (
        <div className="effect-section">
            <div className="effect-title">{title}</div>
            <div className="effect-row">
                <span className="effect-label">{label}（0.5x）</span>
                <div className="effect-values">{renderTypeTags(halfList)}</div>
            </div>
            <div className="effect-row">
                <span className="effect-label">{label}（0.25x）</span>
                <div className="effect-values">{renderTypeTags(quarterList)}</div>
            </div>
        </div>
    );

    const renderGroup = (group, index) => {
        const slots = groupSlots(group.selected);
        const analysis = analyzeGroup(group.selected);
        const isDualType = group.selected.length === 2;

        return (
            <div
                className={`group-card ${activeGroup === group.id ? "active" : ""}`}
                onClick={() => setActiveGroup(group.id)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        setActiveGroup(group.id);
                    }
                }}
                role="button"
                tabIndex={0}
                key={group.id}
            >
                <div className="group-header">
                    <div className="group-title">选择区 {index + 1}（最多 2 个）</div>
                    {groups.length > 1 ? (
                        <button
                            type="button"
                            className="group-delete-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                removeGroup(group.id);
                            }}
                        >
                            删除
                        </button>
                    ) : null}
                </div>
                <div className="selected-top">
                    {slots.map((item, index) => (
                        <div key={index} className="selection-slot">
                            {item ? (
                                <div className="selected-item">
                                    <img src={`assets/type/${item.key}.png`} alt={item.name} className="type-icon" />
                                    <span className="type-name">{item.name}</span>
                                </div>
                            ) : (
                                <p className="placeholder-text">请选择属性 {index + 1}</p>
                            )}
                        </div>
                    ))}
                </div>

                <div className="analysis-area">
                    {analysis ? (
                        <>
                            {!isDualType ? renderStrongSection("攻击时克制", analysis.attack.super2, analysis.attack.super4, "克制") : null}
                            {renderStrongSection("防御时被克制", analysis.defense.super2, analysis.defense.super4, "被克制")}
                            {!isDualType ? renderResistSection("攻击时效果不佳", analysis.attack.resistHalf, analysis.attack.resistQuarter, "抵抗") : null}
                            {renderResistSection("防御时抵抗", analysis.defense.resistHalf, analysis.defense.resistQuarter, "抵抗")}
                        </>
                    ) : (
                        <p className="placeholder-text">选择属性后显示克制关系</p>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="App">
            <aside className="type-sidebar">
                {types.map((item) => (
                    <button key={item.key} className={`type-button ${currentSelected.includes(item.key) ? "selected" : ""}`} onClick={() => toggleType(item.key)} type="button" disabled={!currentSelected.includes(item.key) && currentSelected.length >= 2}>
                        <img src={`assets/type/${item.key}.png`} alt={item.name} className="type-icon" />
                        <span className="type-name">{item.name}</span>
                    </button>
                ))}
            </aside>

            <main className="result-area">
                <div className="group-toolbar">
                    <button type="button" className="group-add-btn" onClick={addGroup}>
                        添加选择区
                    </button>
                </div>
                {groups.map((group, index) => renderGroup(group, index))}
            </main>
        </div>
    );
}

export default App;
