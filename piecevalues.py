import matplotlib.pyplot as plt
import networkx as nx

# Reuse same data structure
point_value_rows = {
    1: ["Pawn"],
    2: ["Splitter"],
    3: ["Bishop", "Knight"],
    4: ["4-point Bishop", "4-point Knight", "Jumper"],
    5: ["5-point Bishop", "Rook", "5-point Jumper"],
    6: ["6-point Bishop", "6-point Rook", "6-point Jumper"],
    7: ["7-point Bishop", "7-point Rook", "7-point Jumper", "Super Jumper"],
    8: ["8-point Bishop", "8-point Rook", "8-point Jumper", "8-point Super Jumper"],
    9: ["Queen", "Hyper Jumper"],
    10: ["10-point Queen", "Mistress Jumper"],
    11: [],
    12: ["Hybrid Queen"]
}

evolutions = [
    ("Pawn", "Splitter"),
    ("Splitter", "Bishop"),
    ("Splitter", "Knight"),
    ("Bishop", "4-point Bishop"),
    ("Knight", "4-point Knight"),
    ("Knight", "Jumper"),
    ("4-point Bishop", "5-point Bishop"),
    ("5-point Bishop", "6-point Bishop"),
    ("6-point Bishop", "7-point Bishop"),
    ("7-point Bishop", "8-point Bishop"),
    ("8-point Bishop", "Queen"),
    ("4-point Bishop", "Rook"),
    ("4-point Knight", "Rook"),
    ("4-point Knight", "5-point Jumper"),
    ("Jumper", "5-point Jumper"),
    ("Rook", "6-point Rook"),
    ("6-point Rook", "7-point Rook"),
    ("7-point Rook", "8-point Rook"),
    ("8-point Rook", "Queen"),
    ("Queen", "10-point Queen"),
    ("10-point Queen", "Hybrid Queen"),
    ("5-point Jumper", "6-point Jumper"),
    ("6-point Jumper", "7-point Jumper"),
    ("7-point Jumper", "8-point Jumper"),
    ("8-point Jumper", "Queen"),
    ("6-point Jumper","Super Jumper"),
    ("Super Jumper", "8-point Super Jumper"),
    ("8-point Super Jumper", "Hyper Jumper"),
    ("Hyper Jumper", "Mistress Jumper"),
    ("10-point Queen", "Hybrid Queen"),
    ("Mistress Jumper", "Hybrid Queen")
]

# Create graph
G = nx.DiGraph()
G.add_edges_from(evolutions)

# Use same positions as previous structure, but apply styling
horizontal_spacing = 2.8
vertical_spacing = 2.2
pos = {}
for row, pieces in point_value_rows.items():
    count = len(pieces)
    for i, piece in enumerate(pieces):
        x = i * horizontal_spacing - ((count - 1) * horizontal_spacing / 2)
        y = -row * vertical_spacing
        pos[piece] = (x, y)

# Draw with custom node styles
plt.figure(figsize=(22, 14))
nx.draw_networkx_edges(G, pos, edge_color="#444", arrows=True, width=1.2)
nx.draw_networkx_labels(G, pos, font_size=9, font_weight="bold")

# Custom styled nodes
node_colors = "#e6f2ff"
node_shapes = {}
for node in G.nodes:
    node_shapes[node] = "o"

# Draw nodes manually to get styled circular patches
ax = plt.gca()
for node, (x, y) in pos.items():
    ax.add_patch(plt.Circle((x, y), 0.9, color=node_colors, ec="#555", zorder=1))
    plt.text(x, y, node, ha="center", va="center", fontsize=9, fontweight="bold", zorder=2)

# Draw horizontal lines and point value labels
for row in point_value_rows:
    y = -row * vertical_spacing
    plt.axhline(y=y, color="#ccc", linestyle="--", linewidth=0.5)
    plt.text(-10, y, f"{row}", fontsize=10, ha="right", va="center", fontweight="bold")

plt.title("Piece Evolutions and Point Values", fontsize=16, weight='bold')
plt.axis('off')
plt.tight_layout()

# Save output
output_path = "/mnt/data/Evolution_Flowchart_WebStructure.png"
plt.savefig(output_path)
output_path
