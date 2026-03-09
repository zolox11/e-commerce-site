import tkinter as tk
from tkinter import ttk, messagebox
import json
import re
import os

PRODUCT_FILE = "products.js"


# ----------------------------
# JS PRODUCT FILE PARSER
# ----------------------------

def parse_products_js():
    if not os.path.exists(PRODUCT_FILE):
        return []

    with open(PRODUCT_FILE, "r", encoding="utf-8") as f:
        text = f.read()

    match = re.search(r"\[(.*)\]", text, re.S)
    if not match:
        return []

    js = "[" + match.group(1) + "]"

    # convert JS syntax → JSON
    js = re.sub(r'(\w+):', r'"\1":', js)
    js = js.replace("'", '"')

    try:
        data = json.loads(js)
        return data
    except Exception as e:
        print("Parse error:", e)
        return []


def save_products_js(products):

    js = "const products = " + json.dumps(products, indent=2) + ";"

    with open(PRODUCT_FILE, "w", encoding="utf-8") as f:
        f.write(js)


# ----------------------------
# MAIN APP
# ----------------------------

class ProductManager:

    def __init__(self, root):

        self.root = root
        self.root.title("Product Manager")
        self.root.geometry("1200x700")
        self.root.minsize(900, 600)

        self.products = parse_products_js()

        self.build_ui()
        self.load_table()

    # ----------------------------
    # UI
    # ----------------------------

    def build_ui(self):

        self.root.grid_rowconfigure(0, weight=1)
        self.root.grid_columnconfigure(1, weight=1)

        # LEFT PANEL
        left = ttk.Frame(self.root, padding=10)
        left.grid(row=0, column=0, sticky="ns")

        # RIGHT PANEL
        right = ttk.Frame(self.root, padding=10)
        right.grid(row=0, column=1, sticky="nsew")

        right.grid_columnconfigure(1, weight=1)

        # ----------------
        # TABLE
        # ----------------

        columns = ("id", "name", "category", "gender", "price")

        self.tree = ttk.Treeview(
            left,
            columns=columns,
            show="headings",
            height=25
        )

        for col in columns:
            self.tree.heading(col, text=col.upper())
            self.tree.column(col, width=100, anchor="center")

        self.tree.pack(side="left", fill="y")

        scroll = ttk.Scrollbar(left, orient="vertical", command=self.tree.yview)
        scroll.pack(side="right", fill="y")

        self.tree.configure(yscrollcommand=scroll.set)

        self.tree.bind("<<TreeviewSelect>>", self.select_product)

        # ----------------
        # BUTTONS
        # ----------------

        btn_frame = ttk.Frame(left)
        btn_frame.pack(fill="x", pady=10)

        ttk.Button(btn_frame, text="New Product", command=self.clear_form).pack(fill="x", pady=2)
        ttk.Button(btn_frame, text="Delete", command=self.delete_product).pack(fill="x", pady=2)

        # ----------------
        # FORM
        # ----------------

        labels = [
            "Name",
            "Category",
            "Gender",
            "Price",
            "Description"
        ]

        self.entries = {}

        for i, label in enumerate(labels):
            ttk.Label(right, text=label).grid(row=i, column=0, sticky="w", pady=4)

            entry = ttk.Entry(right)
            entry.grid(row=i, column=1, sticky="ew")

            self.entries[label] = entry

        # description bigger
        self.entries["Description"].config(width=60)

        # ----------------
        # SIZES
        # ----------------

        ttk.Label(right, text="Sizes").grid(row=5, column=0, sticky="w")

        self.sizes_list = tk.Listbox(right, height=5)
        self.sizes_list.grid(row=5, column=1, sticky="ew")

        size_frame = ttk.Frame(right)
        size_frame.grid(row=6, column=1, sticky="w")

        self.size_entry = ttk.Entry(size_frame, width=10)
        self.size_entry.pack(side="left")

        ttk.Button(size_frame, text="Add", command=self.add_size).pack(side="left")

        # ----------------
        # COLORS
        # ----------------

        ttk.Label(right, text="Colors").grid(row=7, column=0, sticky="w")

        self.colors_list = tk.Listbox(right, height=5)
        self.colors_list.grid(row=7, column=1, sticky="ew")

        color_frame = ttk.Frame(right)
        color_frame.grid(row=8, column=1, sticky="w")

        self.color_name = ttk.Entry(color_frame, width=10)
        self.color_name.pack(side="left")

        self.color_image = ttk.Entry(color_frame, width=30)
        self.color_image.pack(side="left")

        ttk.Button(color_frame, text="Add", command=self.add_color).pack(side="left")

        # ----------------
        # SAVE BUTTON
        # ----------------

        ttk.Button(
            right,
            text="Save Product",
            command=self.save_product
        ).grid(row=9, column=1, sticky="e", pady=15)

    # ----------------------------
    # TABLE
    # ----------------------------

    def load_table(self):

        for i in self.tree.get_children():
            self.tree.delete(i)

        for p in self.products:
            self.tree.insert(
                "",
                "end",
                values=(
                    p["id"],
                    p["name"],
                    p["category"],
                    p["gender"],
                    p["price"]
                )
            )

    # ----------------------------
    # FORM HELPERS
    # ----------------------------

    def clear_form(self):

        for e in self.entries.values():
            e.delete(0, tk.END)

        self.sizes_list.delete(0, tk.END)
        self.colors_list.delete(0, tk.END)

    def add_size(self):

        val = self.size_entry.get().strip()
        if val:
            self.sizes_list.insert(tk.END, val)
            self.size_entry.delete(0, tk.END)

    def add_color(self):

        color = self.color_name.get().strip()
        image = self.color_image.get().strip()

        if color and image:
            self.colors_list.insert(tk.END, f"{color}|{image}")
            self.color_name.delete(0, tk.END)
            self.color_image.delete(0, tk.END)

    # ----------------------------
    # PRODUCT SELECTION
    # ----------------------------

    def select_product(self, event):

        sel = self.tree.selection()
        if not sel:
            return

        item = self.tree.item(sel[0])
        pid = item["values"][0]

        for p in self.products:

            if p["id"] == pid:

                self.clear_form()

                self.entries["Name"].insert(0, p["name"])
                self.entries["Category"].insert(0, p["category"])
                self.entries["Gender"].insert(0, p["gender"])
                self.entries["Price"].insert(0, p["price"])
                self.entries["Description"].insert(0, p["description"])

                for s in p["sizes"]:
                    self.sizes_list.insert(tk.END, s)

                for c in p["colors"]:
                    self.colors_list.insert(
                        tk.END,
                        f'{c["color"]}|{c["image"]}'
                    )

                self.editing_id = pid
                return

    # ----------------------------
    # SAVE PRODUCT
    # ----------------------------

    def save_product(self):

        try:

            name = self.entries["Name"].get()
            category = self.entries["Category"].get()
            gender = self.entries["Gender"].get()
            price = float(self.entries["Price"].get())
            description = self.entries["Description"].get()

            sizes = list(self.sizes_list.get(0, tk.END))

            colors = []
            for c in self.colors_list.get(0, tk.END):
                col, img = c.split("|")
                colors.append({
                    "color": col,
                    "image": img
                })

            if hasattr(self, "editing_id"):

                for p in self.products:
                    if p["id"] == self.editing_id:
                        p.update({
                            "name": name,
                            "category": category,
                            "gender": gender,
                            "price": price,
                            "description": description,
                            "sizes": sizes,
                            "colors": colors
                        })

            else:

                new_id = max([p["id"] for p in self.products], default=0) + 1

                self.products.append({
                    "id": new_id,
                    "name": name,
                    "category": category,
                    "gender": gender,
                    "price": price,
                    "description": description,
                    "sizes": sizes,
                    "colors": colors
                })

            save_products_js(self.products)

            self.load_table()
            self.clear_form()

        except Exception as e:
            messagebox.showerror("Error", str(e))

    # ----------------------------
    # DELETE
    # ----------------------------

    def delete_product(self):

        sel = self.tree.selection()
        if not sel:
            return

        item = self.tree.item(sel[0])
        pid = item["values"][0]

        self.products = [p for p in self.products if p["id"] != pid]

        save_products_js(self.products)

        self.load_table()


# ----------------------------
# RUN
# ----------------------------

root = tk.Tk()

# better ttk style for linux / hyprland
style = ttk.Style()
style.theme_use("clam")

app = ProductManager(root)

root.mainloop()