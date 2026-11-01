#!/usr/bin/env python3
import os
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter
import trimesh

def build_meta_chest():
    img_path = "public/assets/meta_concept_chest.jpg"
    print(f"[*] Processing 3D Chest from: {img_path}")
    img = Image.open(img_path).convert("RGB")
    w_orig, h_orig = img.size

    grid_w = 140
    grid_h = int(grid_w * (h_orig / w_orig))
    img_res = img.resize((grid_w, grid_h), Image.Resampling.LANCZOS)
    arr = np.array(img_res, dtype=np.float32) / 255.0

    # Perceptual luminance
    lum = 0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]

    # Foreground isolation
    bg_lum = np.median([lum[:5, :5], lum[:5, -5:], lum[-5:, :5], lum[-5:, -5:]])
    fg_mask = np.clip((np.abs(lum - bg_lum) - 0.06) / 0.22, 0.0, 1.0)

    # Volumetric dome
    y_coords, x_coords = np.mgrid[0:grid_h, 0:grid_w]
    cx = grid_w / 2.0
    cy = grid_h / 2.0
    nx = (x_coords - cx) / cx
    ny = (y_coords - cy) / cy
    r2 = np.clip(1.0 - (nx**2 + ny**2), 0.0, 1.0)
    dome = np.sqrt(r2)

    # Depth towards -Z (facing camera at negative Z)
    depth_front = (dome * 0.6 + lum * 0.4) * fg_mask * 0.65
    depth_front = gaussian_filter(depth_front, sigma=1.2)
    depth_back = -depth_front * 0.5

    aspect = grid_w / grid_h
    scale_x = aspect * 2.2
    scale_y = 2.2

    verts = []
    uvs = []

    # Front vertices (Z = -depth_front so facing -Z towards camera)
    for y in range(grid_h):
        for x in range(grid_w):
            vx = ((x / (grid_w - 1)) - 0.5) * scale_x
            vy = (0.5 - (y / (grid_h - 1))) * scale_y
            vz = -depth_front[y, x]
            verts.append([vx, vy, vz])
            uvs.append([x / (grid_w - 1), 1.0 - (y / (grid_h - 1))])

    # Back vertices
    back_offset = len(verts)
    for y in range(grid_h):
        for x in range(grid_w):
            vx = ((x / (grid_w - 1)) - 0.5) * scale_x
            vy = (0.5 - (y / (grid_h - 1))) * scale_y
            vz = -depth_back[y, x] + 0.15
            verts.append([vx, vy, vz])
            uvs.append([x / (grid_w - 1), 1.0 - (y / (grid_h - 1))])

    faces = []
    # Front faces (facing -Z)
    for y in range(grid_h - 1):
        for x in range(grid_w - 1):
            i0 = y * grid_w + x
            i1 = i0 + 1
            i2 = (y + 1) * grid_w + x
            i3 = i2 + 1
            faces.append([i0, i1, i2])
            faces.append([i1, i3, i2])

    # Back faces (facing +Z)
    for y in range(grid_h - 1):
        for x in range(grid_w - 1):
            i0 = back_offset + y * grid_w + x
            i1 = i0 + 1
            i2 = back_offset + (y + 1) * grid_w + x
            i3 = i2 + 1
            faces.append([i0, i2, i1])
            faces.append([i1, i2, i3])

    # Stitch edge walls
    for x in range(grid_w - 1):
        f0 = x
        f1 = f0 + 1
        b0 = back_offset + x
        b1 = b0 + 1
        faces.append([f0, b0, b1])
        faces.append([f0, b1, f1])
        bot_f0 = (grid_h - 1) * grid_w + x
        bot_f1 = bot_f0 + 1
        bot_b0 = back_offset + bot_f0
        bot_b1 = back_offset + bot_f1
        faces.append([bot_f0, bot_b1, bot_b0])
        faces.append([bot_f0, bot_f1, bot_b1])

    for y in range(grid_h - 1):
        left_f0 = y * grid_w
        left_f1 = (y + 1) * grid_w
        left_b0 = back_offset + left_f0
        left_b1 = back_offset + left_f1
        faces.append([left_f0, left_f1, left_b1])
        faces.append([left_f0, left_b1, left_b0])
        right_f0 = (y + 1) * grid_w - 1
        right_f1 = (y + 2) * grid_w - 1
        right_b0 = back_offset + right_f0
        right_b1 = back_offset + right_f1
        faces.append([right_f0, right_b0, right_b1])
        faces.append([right_f0, right_b1, right_f1])

    # Create Trimesh with PBR material
    tex = trimesh.visual.TextureVisuals(uv=uvs, image=img)
    mat = trimesh.visual.material.PBRMaterial(
        roughnessFactor=0.32,
        metallicFactor=0.45,
        baseColorTexture=img
    )
    tex.material = mat
    mesh = trimesh.Trimesh(vertices=verts, faces=faces, visual=tex)
    mesh.fix_normals()

    out_glb = "public/assets/meta_concept_chest.glb"
    mesh.export(out_glb)
    print(f"[+] Exported Chest GLB: {out_glb} ({os.path.getsize(out_glb)/1024:.1f} KB)")


def build_meta_snow_world():
    img_path = "public/assets/meta_snow_world.jpg"
    print(f"[*] Processing 3D Snow World from: {img_path}")
    img = Image.open(img_path).convert("RGB")
    w, h = 160, 160
    img_res = img.resize((w, h), Image.Resampling.LANCZOS)
    arr = np.array(img_res, dtype=np.float32) / 255.0

    lum = 0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]

    # Create wide snow ground: 260m x 260m
    terrain_w = 260.0
    terrain_d = 260.0
    y_coords, x_coords = np.mgrid[0:h, 0:w]
    cx = w / 2.0
    cy = h / 2.0

    dist_x = ((x_coords - cx) / cx) * (terrain_w / 2.0)
    dist_z = ((y_coords - cy) / cy) * (terrain_d / 2.0)
    radial_dist = np.sqrt(dist_x**2 + dist_z**2)

    # Gentle height scale (max 3.2m at perimeter, 0m at center)
    edge_factor = np.clip((radial_dist - 22.0) / (terrain_w * 0.45), 0.0, 1.0) ** 1.6
    elevation = (lum * 0.3 + edge_factor * 0.7) * 3.5

    # Center flattening around radius = 22m (where chest and player rest)
    center_factor = np.clip(radial_dist / 22.0, 0.0, 1.0)
    center_factor = 0.5 * (1.0 - np.cos(np.pi * center_factor))
    elevation = elevation * center_factor - 0.2
    elevation = gaussian_filter(elevation, sigma=2.0)

    verts = []
    uvs = []
    for yi in range(h):
        for xi in range(w):
            vx = ((xi / (w - 1)) - 0.5) * terrain_w
            vz = ((yi / (h - 1)) - 0.5) * terrain_d
            vy = elevation[yi, xi]
            verts.append([vx, vy, vz])
            uvs.append([xi / (w - 1), 1.0 - (yi / (h - 1))])

    faces = []
    for yi in range(h - 1):
        for xi in range(w - 1):
            i0 = yi * w + xi
            i1 = i0 + 1
            i2 = (yi + 1) * w + xi
            i3 = i2 + 1
            # Facing up (+Y)
            faces.append([i0, i1, i2])
            faces.append([i1, i3, i2])

    tex = trimesh.visual.TextureVisuals(uv=uvs, image=img)
    mat = trimesh.visual.material.PBRMaterial(
        roughnessFactor=0.88,
        metallicFactor=0.08,
        baseColorTexture=img
    )
    tex.material = mat
    mesh = trimesh.Trimesh(vertices=verts, faces=faces, visual=tex)
    mesh.fix_normals()

    out_glb = "public/assets/meta_snow_world.glb"
    mesh.export(out_glb)
    print(f"[+] Exported Snow World GLB: {out_glb} ({os.path.getsize(out_glb)/1024:.1f} KB)")


if __name__ == "__main__":
    build_meta_chest()
    build_meta_snow_world()
