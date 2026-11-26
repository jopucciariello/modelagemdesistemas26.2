#!/usr/bin/env python3
"""RF30, RF35: converts the catalog spreadsheet (UNIFICADO) into src/lib/catalog/seed.json.

Usage: python3 -I scripts/build-catalog-seed.py <planilha.xlsx> [seed.json]
Interval = average of the spreadsheet range; yellow (warn) at the minimum when min != max (OPEN-17).
Categories are kept from the current seed.json (category plans are not in the spreadsheet).
"""
import json, re, sys
import openpyxl

src = sys.argv[1]
out = sys.argv[2] if len(sys.argv) > 2 else "src/lib/catalog/seed.json"
old = json.load(open(out, encoding="utf-8"))
wb = openpyxl.load_workbook(src, data_only=True)


def rows(name):
    it = wb[name].iter_rows(values_only=True)
    head = next(it)
    for r in it:
        if r[0]:
            yield dict(zip(head, r))


def num(v):
    return (int(v) if float(v).is_integer() else float(v)) if isinstance(v, (int, float)) else None


def plan(name, lo, hi, action, unit):
    lo, hi = num(lo), num(hi)
    if lo is None and hi is None:
        return None
    lo = lo if lo is not None else hi
    hi = hi if hi is not None else lo
    avg = round((lo + hi) / 2)
    warn = round(lo) if lo != hi else None
    p = {"name": name, "intervalKm": None, "intervalHours": None, "action": action, "warnKm": None, "warnHours": None}
    if unit == "km":
        p["intervalKm"], p["warnKm"] = avg, warn
    else:
        p["intervalHours"], p["warnHours"] = avg, warn
    return p


def clean(*parts):
    return " · ".join(str(p) for p in parts if p not in (None, ""))


components = []


def add(r, category, model, details, plans):
    components.append({
        "code": r["ID"], "category": category, "brand": r["Marca"], "model": str(model),
        "modality": r.get("Modalidade"), "subcategory": r.get("Subcategoria") or r.get("Uso / subcategoria"),
        "details": details or None,
        "priceMin": num(r.get("Preço mín (R$)")) , "priceMax": num(r.get("Preço máx (R$)")),
        "plans": [p for p in plans if p],
    })


for r in rows("Transmissão"):
    add(r, "Transmissão", r["Linha / Grupo"], clean(r["Série / código"], r["Velocidades"], r["Acionamento"], f"nível {r['Nível']}" if r["Nível"] else None),
        [plan("Corrente", r["Corrente km (mín)"], r["Corrente km (máx)"], "REPLACE", "km"),
         plan("Cassete", r["Cassete km (mín)"], r["Cassete km (máx)"], "REPLACE", "km")])
for r in rows("Suspensão"):
    b, c = num(r["Revisão básica (h)"]), num(r["Revisão completa (h)"])
    add(r, "Suspensão", r["Modelo"], clean(r["Tipo"], f"bengala {r['Bengala (mm)']} mm" if r["Bengala (mm)"] else None, f"curso {r['Curso (mm)']} mm" if r["Curso (mm)"] else None, r["Versões / níveis"]),
        [plan("Revisão da câmara de ar" if "mortecedor" in str(r["Tipo"]) else "Revisão de lowers (óleo e retentores)", b, b, "SERVICE", "h"), plan("Revisão completa", c, c, "SERVICE", "h")])
for r in rows("Pneus"):
    add(r, "Pneus", r["Modelo"], clean(r["Posição ideal"], r["Medidas comuns"], r["Carcaça / composto"]),
        [plan("Troca", r["Vida útil km (mín)"], r["Vida útil km (máx)"], "REPLACE", "km")])
for sheet, cat, pname, action in [("Freios", "Freios", "Pastilhas", "REPLACE"), ("Rodas", "Rodas", "Revisão de rolamentos", "SERVICE"), ("Canotes", "Canotes", "Revisão", "SERVICE"), ("Selins", "Selins", None, None)]:
    for r in rows(sheet):
        unit = "h" if str(r.get("Unidade") or "").startswith("h") else "km"
        pl = [plan(pname, r["Durab. mín"], r["Durab. máx"], action, unit)] if pname else []
        add(r, cat, r["Modelo"], r["Detalhes"], pl)

pos = [("Grupo (TRX)", "Grupo"), ("Garfo (SUS)", "Garfo"), ("Amortecedor (SUS)", "Amortecedor"), ("Pneu diant. (PNE)", "Pneu dianteiro"),
       ("Pneu tras. (PNE)", "Pneu traseiro"), ("Freios (FRE)", "Freios"), ("Rodas (ROD)", "Rodas"), ("Canote (CAN)", "Canote"), ("Selim (SEL)", "Selim")]
codes = {c["code"] for c in components}
bikes = []
for r in rows("Bikes"):
    parts = [{"position": p, "code": r[col]} for col, p in pos if r[col]]
    missing = [p["code"] for p in parts if p["code"] not in codes]
    assert not missing, (r["ID"], missing)
    bikes.append({"code": r["ID"], "brand": r["Marca"], "model": r["Modelo"], "version": r["Versão / ano"], "category": r["Categoria"],
                  "frame": r["Quadro"], "listPrice": r["Preço de lista"], "parts": parts})

d = {"source": "Planilha 'Catálogo de Peças de Ciclismo — UNIFICADO' (pesquisa de nov/2026)", "categories": old["categories"], "components": components, "bikeModels": bikes}
json.dump(d, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(components), "components", len(bikes), "bikes")
