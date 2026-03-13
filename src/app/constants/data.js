import { C } from "./colors";

export const discFull = { D: "Dominance", I: "Influence", S: "Steadiness", C: "Compliance" };
export const biasInfo = { "+": { word: "Requires", bg: "#F0FAF0", fg: "#2E7D32", bd: "#2E7D32" }, "\u2212": { word: "Undervalues", bg: "#FFF8F5", fg: "#E65100", bd: "#E65100" }, "=": { word: "Balanced", bg: "#F5F9FF", fg: "#1565C0", bd: "#1565C0" } };
export const valLevel = s => s >= 70 ? { l: "Very High", c: "#2E7D32" } : s >= 60 ? { l: "High", c: "#558B2F" } : s >= 40 ? { l: "Average", c: C.muted } : s >= 25 ? { l: "Low", c: "#E65100" } : { l: "Very Low", c: "#C62828" };
export const getDom = n => { const sorted = Object.entries(n).sort((a, b) => b[1] - a[1]); return sorted.filter(e => e[1] >= 60).map(e => e[0]).join("/") || sorted[0][0]; };
export const isEqualExtProfile = (extArr) => { const scores = extArr.map(a => a.score); const max = Math.max(...scores); const min = Math.min(...scores); return (max - min) <= 0.5; };
export const normBias = (b) => b === "-" ? "\u2212" : b;

const mkP = (id, name, orgId, teamId, dn, da, vals, ext, int_) => ({
  id, name, orgId, teamId,
  disc: { natural: { D: dn[0], I: dn[1], S: dn[2], C: dn[3] }, adaptive: { D: da[0], I: da[1], S: da[2], C: da[3] } },
  values: { Aesthetic: vals[0], Economic: vals[1], Individualistic: vals[2], Political: vals[3], Altruistic: vals[4], Regulatory: vals[5], Theoretical: vals[6] },
  attr: {
    ext: [{ name: "Empathy", label: "Heart", score: ext[0], bias: ext[1] }, { name: "Practical Thinking", label: "Hand", score: ext[2], bias: ext[3] }, { name: "Systems Judgment", label: "Head", score: ext[4], bias: ext[5] }],
    int: [{ name: "Self-Esteem", score: int_[0], bias: int_[1] }, { name: "Role Awareness", score: int_[2], bias: int_[3] }, { name: "Self-Direction", score: int_[4], bias: int_[5] }]
  }
});

export const initOrgs = [{ id: "org1", name: "BTCG", teams: [{ id: "t1", name: "Unassigned" }, { id: "t2", name: "Leadership Team" }] }];
export const initPeople = [
  mkP("p1","Daniel Truelove Jr.","org1","t1",[81,99,46,25],[49,91,17,10],[16,49,60,60,81,48,43],[8.3,"\u2212",8.3,"+",8.3,"="],[7.4,"\u2212",7.1,"+",7.6,"+"]),
  mkP("p2","Sareya Truelove","org1","t1",[11,60,99,99],[10,25,91,28],[71,36,50,30,88,51,28],[8.6,"\u2212",9.0,"\u2212",7.9,"+"],[8.1,"\u2212",7.9,"+",8.1,"+"]),
  mkP("p3","Pamela Truelove-Walker","org1","t1",[21,53,88,88],[42,53,25,74],[48,30,30,76,71,41,56],[7.4,"=",8.1,"\u2212",8.1,"+"],[7.4,"\u2212",7.1,"+",8.1,"+"]),
  mkP("p4","Timothy Hurd","org1","t2",[49,99,77,25],[42,67,46,28],[38,15,56,71,46,63,60],[7.4,"\u2212",8.3,"\u2212",9.3,"+"],[8.8,"+",6.9,"\u2212",5.5,"+"]),
  mkP("p5","Glenn Greene","org1","t2",[49,67,63,46],[49,74,17,53],[55,61,55,73,53,26,36],[9.0,"\u2212",7.4,"\u2212",5.7,"\u2212"],[7.4,"\u2212",5.7,"+",4.0,"+"]),
  mkP("p6","Kinasha Brown","org1","t2",[99,53,63,32],[95,25,25,10],[36,56,43,83,60,30,50],[8.3,"=",7.6,"\u2212",8.6,"\u2212"],[8.6,"\u2212",6.0,"+",7.1,"\u2212"]),
  mkP("p7","Jamaica Canady","org1","t2",[25,46,99,77],[25,25,60,67],[43,59,41,48,46,68,53],[5.7,"\u2212",4.0,"\u2212",4.5,"+"],[6.0,"\u2212",6.4,"+",4.0,"+"]),
  mkP("p8","Taquia Hylton","org1","t2",[35,67,46,88],[56,67,25,42],[41,40,41,58,58,85,31],[8.8,"=",9.0,"\u2212",8.6,"+"],[7.4,"\u2212",6.2,"+",6.2,"+"]),
  mkP("p9","Dr. Demetra Baxter-Oliver","org1","t2",[49,67,39,77],[56,60,32,42],[35,52,43,58,53,36,80],[7.9,"\u2212",7.9,"=",8.3,"+"],[7.9,"\u2212",5.2,"\u2212",6.2,"+"]),
  mkP("p10","Lisa Green","org1","t2",[14,53,99,99],[10,39,70,53],[60,9,36,56,81,60,46],[7.6,"\u2212",6.4,"\u2212",7.1,"+"],[5.0,"\u2212",6.0,"+",5.5,"+"]),
  mkP("p11","Lamarr Miller","org1","t2",[42,81,99,25],[42,25,70,28],[43,46,66,65,40,48,48],[8.6,"\u2212",7.6,"\u2212",6.9,"+"],[8.8,"+",6.4,"\u2212",4.0,"+"]),
  mkP("p12","Jamie Crosen","org1","t2",[56,28,99,53],[49,39,46,53],[36,30,66,66,56,63,35],[8.3,"=",8.1,"\u2212",9.0,"+"],[4.0,"\u2212",5.0,"+",4.8,"+"]),
  mkP("p13","Kenndell Smith","org1","t2",[99,67,21,53],[77,67,10,28],[38,65,63,68,36,48,41],[8.1,"\u2212",7.9,"\u2212",6.2,"+"],[7.1,"\u2212",6.4,"+",6.2,"+"]),
  mkP("p14","Carolyn Smiley","org1","t2",[56,60,39,77],[70,53,32,28],[48,49,73,40,63,43,41],[9.3,"=",6.4,"\u2212",8.8,"+"],[7.6,"\u2212",6.4,"+",4.0,"+"]),
  mkP("p15","Sophia Jones-Redmond","org1","t2",[25,81,99,39],[49,25,63,28],[60,71,60,36,50,50,35],[4.3,"\u2212",4.0,"\u2212",4.8,"+"],[8.6,"\u2212",6.4,"=",4.0,"\u2212"])
];
