from setuptools import setup

package_name = 'qcar_bringup'

setup(
    name=package_name,
    version='0.1.0',
    packages=[package_name],
    data_files=[
        ('share/ament_index/resource_index/packages', ['resource/' + package_name]),
        ('share/' + package_name, ['package.xml']),
        ('share/' + package_name + '/launch', [
            'launch/web_viz.launch.py',
            'launch/launch_browser_sim.py',
            'launch/gazebo_sim.launch.py',
            'launch/lidar_wall_test.launch.py',
        ]),
    ],
    install_requires=['setuptools'],
    zip_safe=True,
    maintainer='isoLina',
    maintainer_email='you@example.com',
    description='Bringup para visualización web (URDF+TF) y servicios opcionales',
    license='MIT',
    entry_points={
        'console_scripts': [
            'compressed_republisher = qcar_bringup.compressed_republisher:main',
            'dummy_camera_publisher = qcar_bringup.dummy_camera_publisher:main',
        ],
    },
)
