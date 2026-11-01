#!/usr/bin/env python3
"""
Meta SAM / 3D Gen World Builder
Decomposes the high-detail concept image into semantic 3D layers:
1. Sculpted Snow Valley & Forefront Drifts
2. Crystalline Frozen Glacial Ice Lake
3. Heavy Snow-Laden Fir Pine Tree Assets
4. Distant Alpine Mountain Skyline Backdrop
"""
import os
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter
import trimesh

REF_IMG_PATH = "public/assets/snow_world_reference.jpg"

def build_snow_valley_mesh():
    print("[*] Generating Layer 1: Sculpted Snow Valley Terrain...")
    img = Image.open(REF_IMG_PATH).convert("RGB")
    w, h = 180, 180
    grid_w, grid_h = w, h

    # World dimensions (meters)
    world_w = 320.0
    world_d = 320.0

    y_coords, x_coords = np.mgrid[0:grid_h, 0:grid_w]
    cx = grid_w / 2.0
    cy = grid_h / 2.0

    # Normalized coords from -1 to 1
    nx = (x_coords - cx) / cx
    ny = (y_coords - cy) / cy
    world_x = nx * (world_w / 2.0)
    world_z = ny * (world_d / 2.0)

    # 1. Distant perimeter mountains elevation (rises steeply towards outer edges and far back)
    dist_r = np.sqrt(nx**2 + ny**2)
    outer_mountains = np.clip((dist_r - 0.45) / 0.55, 0.0, 1.0) ** 1.8 * 28.0
    # Far horizon bias (back +Z rises into mountain range)
    horizon_rise = np.clip((ny + 0.2) / 1.2, 0.0, 1.0) ** 2.0 * 22.0

    # 2. Frozen Lake Basin Depression in the center-left:
    # Lake center at x: 5, z: 25, radius_x: 48, radius_z: 65
    lake_dx = (world_x - 6.0) / 45.0
    lake_dz = (world_z - 22.0) / 62.0
    lake_dist = np.sqrt(lake_dx**2 + lake_dz**2)
    # Smooth basin carve down to y = -1.2m
    lake_basin = np.clip(1.0 - lake_dist, 0.0, 1.0)
    lake_basin_carve = (np.cos(lake_basin * np.pi) * 0.5 - 0.5) * 2.2

    # 3. Sculpted foreground snow dunes & wind drifts (sinusoidal + noise)
    dune_waves = (
        np.sin(world_x * 0.06 + world_z * 0.04) * 0.85 +
        np.cos(world_x * 0.12 - world_z * 0.08) * 0.45 +
        np.sin(world_x * 0.03 + world_z * 0.09) * 0.65
    )
    # Dunes are most pronounced in foreground (negative Z)
    fg_factor = np.clip((-(world_z - 10.0)) / 60.0, 0.0, 1.0)
    foreground_dunes = dune_waves * fg_factor * 1.4

    # Combined heightmap
    elevation = outer_mountains + horizon_rise + lake_basin_carve + foreground_dunes
    elevation = gaussian_filter(elevation, sigma=1.4)

    verts = []
    uvs = []
    for y in range(grid_h):
        for x in range(grid_w):
            vx = world_x[y, x]
            vz = world_z[y, x]
            vy = elevation[y, x]
            verts.append([vx, vy, vz])
            uvs.append([x / (grid_w - 1) * 6.0, y / (grid_h - 1) * 6.0])

    faces = []
    for y in range(grid_h - 1):
        for x in range(grid_w - 1):
            i0 = y * grid_w + x
            i1 = i0 + 1
            i2 = (y + 1) * grid_w + x
            i3 = i2 + 1
            faces.append([i0, i1, i2])
            faces.append([i1, i3, i2])

    # Load high-res snow texture
    snow_tex = Image.open("public/assets/snow_surface_texture.jpg").convert("RGB")
    tex = trimesh.visual.TextureVisuals(uv=uvs, image=snow_tex)
    mat = trimesh.visual.material.PBRMaterial(
        roughnessFactor=0.92,
        metallicFactor=0.04,
        baseColorTexture=snow_tex
    )
    tex.material = mat
    mesh = trimesh.Trimesh(vertices=verts, faces=faces, visual=tex)
    mesh.fix_normals()

    out_path = "public/assets/meta_snow_valley.glb"
    mesh.export(out_path)
    print(f"[+] Exported Snow Valley: {out_path} ({os.path.getsize(out_path)/1024:.1f} KB)")


def build_frozen_lake_mesh():
    print("[*] Generating Layer 2: Frozen Glacial Ice Lake Mesh...")
    # Elliptical multi-segment lake with winding shoreline
    num_pts = 64
    lake_rx = 45.0
    lake_rz = 60.0
    lake_cx = 6.0
    lake_cz = 22.0

    verts = [[lake_cx, -0.15, lake_cz]] # Center vertex
    uvs = [[0.5, 0.5]]

    # Generate shoreline perimeter with natural bays and bends
    angles = np.linspace(0, 2 * np.pi, num_pts, endpoint=False)
    for a in angles:
        # Subtle shoreline noise
        shore_noise = 1.0 + 0.12 * np.sin(a * 3) + 0.08 * np.cos(a * 5)
        px = lake_cx + np.cos(a) * lake_rx * shore_noise
        pz = lake_cz + np.sin(a) * lake_rz * shore_noise
        verts.append([px, -0.15, pz])
        # UV coordinates mapped into ice crack texture
        u = (np.cos(a) * 0.5 + 0.5)
        v = (np.sin(a) * 0.5 + 0.5)
        uvs.append([u, v])

    faces = []
    for i in range(1, num_pts + 1):
        next_i = 1 if i == num_pts else i + 1
        faces.append([0, i, next_i])

    ice_img = Image.open("public/assets/glacial_ice_texture.jpg").convert("RGB")
    tex = trimesh.visual.TextureVisuals(uv=uvs, image=ice_img)
    mat = trimesh.visual.material.PBRMaterial(
        roughnessFactor=0.08,
        metallicFactor=0.25,
        baseColorTexture=ice_img
    )
    tex.material = mat
    mesh = trimesh.Trimesh(vertices=verts, faces=faces, visual=tex)
    mesh.fix_normals()

    out_path = "public/assets/meta_lake_mesh.glb"
    mesh.export(out_path)
    print(f"[+] Exported Frozen Lake: {out_path} ({os.path.getsize(out_path)/1024:.1f} KB)")


def build_snow_pine_tree():
    print("[*] Generating Layer 3: Heavy Snow-Draped Fir Pine Tree...")
    # Realistic multi-tiered evergreen with heavy cascading snow blankets
    tiers = [
        # (y_base, height, radius, snow_thickness)
        (0.6, 2.8, 1.8, 0.6),
        (2.4, 2.4, 1.4, 0.5),
        (4.0, 2.0, 1.0, 0.45),
        (5.4, 1.8, 0.6, 0.4),
        (6.6, 1.2, 0.25, 0.3)
    ]

    parts = []
    # Trunk
    trunk = trimesh.creation.cylinder(radius=0.22, height=1.6, sections=12)
    trunk.apply_translation([0, 0.8, 0])
    parts.append(trunk)

    # Foliage cones and heavy snow caps
    for y_b, h, r, snow_t in tiers:
        # Needle body (dark frosted pine)
        cone = trimesh.creation.cone(radius=r, height=h, sections=16)
        cone.apply_translation([0, y_b + h * 0.5, 0])
        parts.append(cone)

        # Thick heavy snow layer draped on the branch tier
        snow_cap = trimesh.creation.cone(radius=r * 0.95, height=snow_t, sections=16)
        snow_cap.apply_translation([0, y_b + h - snow_t * 0.4, 0])
        parts.append(snow_cap)

    tree_mesh = trimesh.util.concatenate(parts)
    tree_mesh.fix_normals()
    out_path = "public/assets/meta_snow_pine.glb"
    tree_mesh.export(out_path)
    print(f"[+] Exported Snow Pine: {out_path} ({os.path.getsize(out_path)/1024:.1f} KB)")


def build_mountain_panorama_backdrop():
    print("[*] Generating Layer 4: 360 Alpine Mountain Skyline Cylinder...")
    # High cylinder surrounding the world with the photo-real mountain peaks
    radius = 155.0
    height = 95.0
    segments = 48

    verts = []
    uvs = []
    angles = np.linspace(0, 2 * np.pi, segments, endpoint=False)

    for i, a in enumerate(angles):
        x = np.sin(a) * radius
        z = np.cos(a) * radius
        # Bottom vertex
        verts.append([x, -4.0, z])
        uvs.append([i / (segments - 1), 1.0])
        # Top vertex
        verts.append([x, height - 4.0, z])
        uvs.append([i / (segments - 1), 0.0])

    faces = []
    for i in range(segments):
        i0 = i * 2
        i1 = i * 2 + 1
        next_i = (i + 1) % segments
        i2 = next_i * 2
        i3 = next_i * 2 + 1
        # Inward facing (seen from inside the cylinder)
        faces.append([i0, i2, i1])
        faces.append([i1, i2, i3])

    pano_img = Image.open("public/assets/snow_mountains_panorama.jpg").convert("RGB")
    tex = trimesh.visual.TextureVisuals(uv=uvs, image=pano_img)
    mat = trimesh.visual.material.PBRMaterial(
        roughnessFactor=0.98,
        metallicFactor=0.0,
        baseColorTexture=pano_img
    )
    tex.material = mat
    mesh = trimesh.Trimesh(vertices=verts, faces=faces, visual=tex)
    mesh.fix_normals()

    out_path = "public/assets/meta_mountain_sky.glb"
    mesh.export(out_path)
    print(f"[+] Exported Mountain Skyline: {out_path} ({os.path.getsize(out_path)/1024:.1f} KB)")


if __name__ == "__main__":
    build_snow_valley_mesh()
    build_frozen_lake_mesh()
    build_snow_pine_tree()
    build_mountain_panorama_backdrop()
    print("[+] All Meta SAM 3D World Layers successfully built!")
